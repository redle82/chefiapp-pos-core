import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isDebugMode } from "../../../core/debugMode";
import {
  getTabIsolated,
  setTabIsolated,
} from "../../../core/storage/TabIsolatedStorage";
// Auth only — temporary until Core Auth (session / signOut)
import { supabase } from "../../../core/supabase";
import { findRelevantLesson } from "../../../intelligence/education/MicroLessonEngine";
import {
  TrainingProvider,
  useTraining,
} from "../../../intelligence/education/TrainingContext";
import type { PressureMetrics } from "../../../intelligence/forecast/PressureForecast";
import { calculatePressure } from "../../../intelligence/forecast/PressureForecast";
import type { ShiftPrediction } from "../../../intelligence/forecast/ShiftPredictor";
import { getShiftPrediction } from "../../../intelligence/forecast/ShiftPredictor";
import { now as getNow } from "../../../intelligence/nervous-system/Clock";
import type { ShiftMetrics } from "../../../intelligence/nervous-system/ShiftEngine";
import { calculateShiftLoad } from "../../../intelligence/nervous-system/ShiftEngine";
import { useReflexEngine } from "../core/ReflexEngine";
import { useAppStaffOrders } from "../hooks/useAppStaffOrders";
import type {
  BusinessType,
  DominantTool,
  Employee,
  LatentObligation,
  OperationalContract,
  SpecDriftAlert,
  StaffRole,
  Task,
} from "./StaffCoreTypes";

// Re-export types for consumers
export type {
  BusinessType,
  DominantTool,
  Employee,
  LatentObligation,
  OperationalContract,
  StaffRole,
  Task,
} from "./StaffCoreTypes";

// Mock path só com ?debug=1 ou em testes (MODE=test)
const allowMocks = () =>
  isDebugMode() ||
  (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test");

// MODE B: REMOTE CONTRACT (Connect via Bridge)
// Unified function (Client + Mock Hybrid)
const joinRemoteOperationHelper = async (
  code: string,
  setOpContract: (c: OperationalContract) => void,
  setActiveRole: (r: StaffRole) => void
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("🔌 Connecting to Bridge with code:", code);

    // A) MOCK PATH (Dev Only)
    if (allowMocks() && code.includes("mock")) {
      // Simulate network
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (code === "FAIL")
        return { success: false, message: "Simulação de Falha de Rede." };

      const contract: OperationalContract = {
        id: "mock-restaurant-connected",
        type: "restaurant",
        name: "Restaurante Conectado (Demo)",
        mode: "connected",
        permissions: [],
      };

      setOpContract(contract);

      // Auto-set role
      let role: StaffRole = "worker";
      if (code.toLowerCase().includes("mgr")) role = "manager";
      else if (code.toLowerCase().includes("kit")) role = "kitchen";
      else if (code.toLowerCase().includes("own")) role = "owner";

      setActiveRole(role);
      setTabIsolated("staff_role", role);
      return { success: true };
    }

    // B) REAL PATH (Production / Supabase)
    if (typeof supabase === "undefined") {
      return {
        success: false,
        message: "Modo remoto indisponível (Supabase Runtime Missing).",
      };
    }

    const { data, error } = await supabase
      .from("active_invites")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !data) {
      // Mensagem específica baseada no erro
      let errorMessage = "Código inválido ou expirado.";
      if (error?.code === "PGRST116") {
        errorMessage =
          "Código não encontrado. Verifique se digitou corretamente.";
      } else if (error?.code === "22P02") {
        errorMessage =
          "Formato de código inválido. Use o formato CHEF-XXXX-XX.";
      } else if (error?.message?.includes("expired")) {
        errorMessage = "Este código expirou. Solicite um novo ao gerente.";
      }
      return { success: false, message: errorMessage };
    }

    const contract: OperationalContract = {
      id: data.restaurant_id,
      type: "restaurant",
      name: "Restaurante Conectado",
      mode: "connected",
      permissions: [],
    };

    setOpContract(contract);

    const role = (data.role_granted as StaffRole) || "worker";
    setActiveRole(role);
    setTabIsolated("staff_role", role);

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro de conexão." };
  }
};

// ...

// ------------------------------------------------------------------
// 🧠 MODELO MENTAL (The State Engine)
// ------------------------------------------------------------------

interface StaffContextType {
  // 1. IDENTITY & CONTRACT
  operationalContract: OperationalContract | null;
  activeWorkerId: string | null;
  activeRole: StaffRole;
  shiftState: "offline" | "active" | "closing" | "closed";
  activeShift: "offline" | "active" | "closing" | "closed"; // Alias for consumers

  // 2. STATE DERIVATION (The Brain)
  dominantTool: DominantTool;

  // 3. SETUP ACTIONS
  createLocalContract: (type: BusinessType) => void;
  joinRemoteOperation: (
    code: string
  ) => Promise<{ success: boolean; message?: string }>;

  // 4. WORKER ACTIONS
  checkIn: (workerName: string, employeeId?: string) => void;
  checkOut: () => void;
  verifyPin: (employeeId: string, pin: string) => boolean;

  // 5. TASK ENGINE
  tasks: Task[];
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  unfocusTask: (taskId: string) => void;
  createTask: (args: {
    title: string;
    assigneeId: string | null;
    assigneeRole?: StaffRole;
    description?: string;
    priority?: "background" | "attention" | "urgent" | "critical";
    reason?: string;
    type?: "foundational" | "mission_critical";
  }) => void;
  currentRiskLevel: number;

  // 🧪 SIMULATION HOOKS (Internal Use Only)
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setShiftState: React.Dispatch<
    React.SetStateAction<"offline" | "active" | "closing" | "closed">
  >;

  // 🔋 ENERGY SENSOR
  notifyActivity: () => void;
  lastActivityAt: number;

  // 🧠 METABOLIC INPUT (Inventory -> Brain)
  reportObligations: (source: string, obligations: LatentObligation[]) => void;

  // 🛡️ IMMUNE SYSTEM (Human Sensor -> Brain)
  reportSpecDrift: (
    alert: Omit<SpecDriftAlert, "id" | "detectedAt" | "status">
  ) => void;
  specDrifts: SpecDriftAlert[]; // 🛡️ Telemetry for Owner Dashboard
  pressureMode: "idle" | "pressure" | "recovery"; // 🩺 Real-time Pulse
  obligations: LatentObligation[]; // Added to satisfy ManagerCalendarView

  // 6. SHIFT INTELLIGENCE (Phase B)
  shiftStart: number | null;
  activeStaffCount: number;
  shiftMetrics: ShiftMetrics;

  // 7. FORECAST (Phase D)
  forecast: {
    pressure: PressureMetrics;
    prediction: ShiftPrediction;
  };

  // ROSTER
  employees: Employee[];
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

type StaffProviderProps = {
  children: React.ReactNode;
  restaurantId?: string | null;
  userId?: string | null;
};

// INTERNAL PROVIDER (Where logic lives)
const StaffProviderInternal: React.FC<StaffProviderProps> = ({
  children,
  restaurantId,
  userId,
}) => {
  // EXTERNAL SIGNALS (The Senses)
  // FASE 3.3: Isolado - AppStaff não depende de TPV/context
  const { orders: appStaffOrders, refetch: refetchOrders } = useAppStaffOrders(
    operationalContract?.id || null
  );
  // Converter CoreOrder para Order (compatibilidade)
  const orders = appStaffOrders.map((order) => ({
    id: order.id,
    tableNumber: order.table_number || undefined,
    tableId: order.table_id || undefined,
    status: (order.status === "OPEN"
      ? "new"
      : order.status === "IN_PREP"
      ? "preparing"
      : order.status === "READY"
      ? "ready"
      : order.status === "PAID"
      ? "paid"
      : order.status === "CANCELLED"
      ? "cancelled"
      : "new") as
      | "new"
      | "preparing"
      | "ready"
      | "served"
      | "paid"
      | "partially_paid"
      | "cancelled",
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name_snapshot,
      price: item.price_snapshot,
      quantity: item.quantity,
    })),
    total: order.total_cents,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    origin: order.sync_metadata?.origin as any,
  }));

  // FASE 3.3: performOrderAction local (não depende de TPV)
  const performOrderAction = useCallback(
    async (orderId: string, action: string, payload?: any) => {
      // Por enquanto, apenas log - ações de pedido serão implementadas via OrderWriter se necessário
      console.log("[AppStaff] performOrderAction:", {
        orderId,
        action,
        payload,
      });
      // Refetch após ação
      await refetchOrders();
    },
    [refetchOrders]
  );
  const { triggerLesson, learnedSkills } = useTraining(); // Phase C: Training

  // 1. IDENTITY
  const [operationalContract, setOpContract] =
    useState<OperationalContract | null>(null);
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(
    userId || null
  );
  const [activeRole, setActiveRole] = useState<StaffRole>("worker");

  // 2. SHIFT STATE
  const [shiftState, setShiftState] = useState<
    "offline" | "active" | "closing" | "closed"
  >("offline");
  const [lastActivityAt, setLastActivityAt] = useState<number>(getNow());

  // 3. TASK ENGINE (The Conscious Mind)
  const [tasks, setTasks] = useState<Task[]>([]);

  // 4. METABOLISM (Inventory -> Brain)
  const [obligations, setObligations] = useState<LatentObligation[]>([]);
  // const [dominantTool, setDominantTool] = useState<DominantTool>('hands'); // Derived

  // 5. IMMUNE SYSTEM (Spec Drift)
  const [specDrifts, setSpecDrifts] = useState<SpecDriftAlert[]>([]);
  const [pressureMode, setPressureMode] = useState<
    "idle" | "pressure" | "recovery"
  >("idle");

  // AUDIT LAYER STATE
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // 6. ROSTER (For Assignee Selection)
  const [employees, setEmployees] = useState<Employee[]>([]);

  // INIT
  useEffect(() => {
    const storedRole = getTabIsolated("staff_role");
    if (storedRole) setActiveRole(storedRole as StaffRole);

    // Resume session if active
    // In real app, check Supabase presence
    // if (userId) setShiftState('active'); // Auto-start for dev flow?

    // AUTO-JOIN (Owner Mode / Merchant Portal)
    if (restaurantId && userId) {
      const contract: OperationalContract = {
        id: restaurantId,
        type: "restaurant",
        name: "Seu Restaurante",
        mode: "connected",
        permissions: ["admin"],
        role: "owner",
        workerId: userId,
      };
      setOpContract(contract);
      setActiveWorkerId(userId);
      setActiveRole("owner");
      setShiftState("active");
    }
  }, [userId, restaurantId]);

  // FETCH EMPLOYEES
  useEffect(() => {
    if (!operationalContract?.id || operationalContract.mode === "local")
      return;

    const fetchEmployees = async () => {
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("restaurant_id", operationalContract.id)
        .eq("active", true);

      if (data) setEmployees(data as Employee[]);
    };

    fetchEmployees();
  }, [operationalContract?.id]);

  // SENSOR: Activity Heartbeat
  const notifyActivity = useCallback(() => {
    setLastActivityAt(getNow());
  }, []);

  // LOGIC: Dominant Tool Derivation
  // Regra operacional: Garçom sempre pode criar pedidos.
  // Gerente e Dono podem criar pedidos quando necessário (fallback).
  const dominantTool = useMemo((): DominantTool => {
    if (shiftState === "offline") return "hands";

    // Waiter: sempre pode criar pedidos
    if (activeRole === "waiter") return "order";

    // Manager: pode criar pedidos (fallback quando não há garçom)
    if (activeRole === "manager") return "order"; // ✅ Permite acesso ao MiniPOS

    // Owner: pode criar pedidos (contexto excepcional)
    if (activeRole === "owner") return "order"; // ✅ Permite acesso ao MiniPOS

    // Kitchen: visualiza pedidos ou checklist
    if (activeRole === "kitchen") {
      const hasActiveOrders = orders.some(
        (o) => o.status === "OPEN" || o.status === "IN_PREP"
      );
      return hasActiveOrders ? "production" : "check";
    }

    // Cleaning: apenas checklist
    if (activeRole === "cleaning") return "check";

    return "hands";
  }, [shiftState, activeRole, orders]);

  // LOGIC: Risk Level Derivation
  const currentRiskLevel = useMemo(() => {
    if (shiftState !== "active") return 0;
    const totalRisk = tasks.reduce(
      (acc, t) => (t.status === "pending" ? acc + (t.riskLevel || 0) : acc),
      0
    );
    return Math.min(100, totalRisk);
  }, [tasks, shiftState]);

  // SYSTEM REFLEX (The Subconscious)
  useReflexEngine(setTasks, notifyActivity, operationalContract?.id || null);

  // Removido: useReflexEngine antigo que dependia de TPV
  // useReflexEngine(setTasks, notifyActivity);

  // TRAINING REFLEX (Phase C)
  // Watch for new tasks derived from orders and trigger menu-contextual lessons
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    // Find recent KDS tasks
    const recentTasks = tasks.filter(
      (t) =>
        t.meta?.source === "kds-sync" &&
        t.status === "pending" &&
        // Simple check: created in last 10 seconds (in real logic we'd mark 'trainingChecked')
        getNow() - new Date(t.createdAt).getTime() < 10000
    );

    recentTasks.forEach((task) => {
      const orderId = task.meta?.orderId;
      if (!orderId) return;

      const order = orders.find((o) => o.id === orderId);
      if (!order || !order.items) return;

      // Check items for lessons
      order.items.forEach((item: any) => {
        const lesson = findRelevantLesson(
          "menu_item",
          item.name_snapshot || item.name,
          activeRole as any,
          learnedSkills
        );
        if (lesson) {
          // Check if not already triggering
          triggerLesson(lesson);
        }
      });
    });
  }, [tasks.length, activeRole, learnedSkills, triggerLesson]);
  // Dependency on tasks.length is a simple heuristic to re-check when tasks arrive.

  // ACTIONS
  const createLocalContract = (type: BusinessType) => {
    const id = `local-${type}-${Date.now()}`;
    setOpContract({
      id,
      type,
      name: `${type === "restaurant" ? "Restaurante" : "Loja"} Local`,
      mode: "local",
      permissions: ["admin"], // Local creator is admin
    });
    setActiveRole("manager"); // Creator is manager
    setShiftState("active");
    notifyActivity();
  };

  const joinRemoteOperation = async (code: string) => {
    return joinRemoteOperationHelper(code, setOpContract, setActiveRole);
  };

  const checkIn = async (workerName: string, employeeId?: string) => {
    const { supabase } = await import("../../../core/supabase");

    setActiveWorkerId(workerName);
    let currentRole = activeRole;

    if (employeeId) {
      const emp = employees.find((e) => e.id === employeeId);
      if (emp) {
        currentRole = emp.role;
        setActiveRole(emp.role);
      }
    }

    setShiftState("active");
    notifyActivity();

    // 📝 AUDIT: Create Shift Log
    if (operationalContract?.id && employeeId) {
      const { data, error } = await supabase
        .from("shift_logs")
        .insert({
          restaurant_id: operationalContract.id, // Assuming OpContract ID is RestId. If mock, this might fail.
          employee_id: employeeId,
          role: currentRole,
          start_time: new Date().toISOString(),
          status: "active",
          meta: { app_version: "1.0.0", mode: "app_staff" },
        })
        .select()
        .single();

      if (data) {
        setActiveShiftId(data.id);
        console.log("📝 Shift Log Started:", data.id);
      } else if (error) {
        console.error("❌ Failed to create Shift Log:", error);
      }
    }
  };

  const verifyPin = (employeeId: string, pin: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return false;
    if (!emp.pin) return true; // Security flaw? Or feature? Assuming no PIN = open
    return emp.pin === pin;
  };

  const checkOut = async () => {
    const { supabase } = await import("../../../core/supabase");

    // 📝 AUDIT: Close Shift Log
    if (activeShiftId) {
      const endTime = new Date();
      await supabase
        .from("shift_logs")
        .update({
          end_time: endTime.toISOString(),
          status: "completed",
          // duration_minutes calculation would ideally trigger on DB or be sent here.
          // Simplified for now.
        })
        .eq("id", activeShiftId);
      console.log("📝 Shift Log Closed:", activeShiftId);
    }

    setShiftState("closed");
    setActiveWorkerId(null);
    setActiveShiftId(null); // Clear audit state
    setOpContract(null);
  };

  const startTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "focused" } : t))
    );
    notifyActivity();
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);

    // 🌉 KDS BRIDGE: If task is a KDS sync, trigger the action
    if (
      task?.meta?.source === "kds-sync" &&
      task.meta.orderId &&
      task.meta.action
    ) {
      console.log(
        `🌉 BRIDGE: Triggering Action ${task.meta.action} for Order ${task.meta.orderId}`
      );
      performOrderAction(task.meta.orderId, task.meta.action)
        .then(() => console.log("✅ BRIDGE: Action Success"))
        .catch((err) => {
          console.error("❌ BRIDGE: Action Failed", err);
          alert("Falha ao sincronizar com KDS. Tente novamente.");
          // Revert optimistic update?
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: "pending" } : t))
          );
          return; // Stop completion
        });
    }

    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "done" } : t))
    );

    // 📝 AUDIT: Action Log
    if (activeShiftId && task && operationalContract?.id) {
      import("../../../core/supabase").then(({ supabase }) => {
        const empId = employees.find((e) => e.name === activeWorkerId)?.id;

        supabase
          .from("action_logs")
          .insert({
            restaurant_id: operationalContract.id,
            shift_id: activeShiftId,
            employee_id: empId,
            action_type: "task_completion",
            entity_id: taskId,
            details: {
              title: task.title,
              priority: task.priority,
              riskCheck: 0, // Simplification to avoid closure complexity
            },
          })
          .then(({ error }) => {
            if (error) console.error("❌ Action Log Failed:", error);
          });
      });
    }

    const completedCount = tasks.filter((t) => t.status === "done").length + 1;

    // 🎮 GAMIFICATION: Calculate XP for this task
    let taskXP = 10; // Base
    switch (task?.priority) {
      case "attention":
        taskXP += 5;
        break;
      case "urgent":
        taskXP += 10;
        break;
      case "critical":
        taskXP += 20;
        break;
    }

    let message =
      completedCount === 1
        ? `✅ Tarefa concluída! +${taskXP} XP`
        : `✅ ${completedCount} tarefas! +${taskXP} XP`;

    if (operationalContract?.mode === "local") {
      message = "⚠️ Preview: Ação não salva no servidor";
    }

    window.dispatchEvent(
      new CustomEvent("staff-task-complete", {
        detail: { message, taskTitle: task?.title, xpGained: taskXP },
      })
    );
    notifyActivity();

    // Supabase
    if (!taskId.startsWith("temp") && !taskId.startsWith("init")) {
      supabase
        .from("app_tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", taskId)
        .then();
    }
  };

  const unfocusTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "pending" } : t))
    );
  };

  const createTask = (args: Parameters<StaffContextType["createTask"]>[0]) => {
    const newTask: Task = {
      id: `manual-${Date.now()}`,
      title: args.title,
      description: args.description || "",
      status: "pending",
      assigneeRole: args.assigneeRole || "worker", // Default to generic worker
      priority: args.priority || "attention",
      type: args.type || "foundational",
      riskLevel: 10,
      uiMode: "check",
      context: "floor", // Default context
      assigneeId: args.assigneeId || undefined,
      createdAt: getNow(),
      meta: {
        source: "manual-assignment",
        createdBy: activeWorkerId || undefined,
      },
    };

    setTasks((prev) => [newTask, ...prev]);
    notifyActivity();

    // Persist Manual Task
    if (operationalContract?.id) {
      supabase
        .from("app_tasks")
        .insert({
          id: newTask.id,
          restaurant_id: operationalContract.id,
          title: newTask.title,
          description: newTask.description,
          status: "pending",
          priority: newTask.priority,
          type: newTask.type,
          assignee_role: newTask.assigneeRole,
          assignee_id: newTask.assigneeId,
          created_by: newTask.meta?.createdBy,
          created_at: new Date(newTask.createdAt).toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error("Manual Task Insert Failed:", error);
        });
    }
  };

  const reportObligations = (
    source: string,
    newObligations: LatentObligation[]
  ) => {
    // Simple merge for now, avoiding duplicates by ID
    setObligations((prev) => {
      const others = prev.filter(
        (o) => !newObligations.some((n) => n.id === o.id)
      );
      return [...others, ...newObligations];
    });
  };

  const reportSpecDrift = (
    alert: Omit<SpecDriftAlert, "id" | "detectedAt" | "status">
  ) => {
    const newAlert: SpecDriftAlert = {
      id: `drift-${Date.now()}`,
      ...alert,
      detectedAt: getNow(),
      status: "new",
    };
    setSpecDrifts((prev) => [newAlert, ...prev]);
    notifyActivity();
  };

  return (
    <StaffContext.Provider
      value={{
        operationalContract,
        activeWorkerId,
        activeRole,
        shiftState,
        activeShift: shiftState, // Alias
        dominantTool,
        tasks,
        employees, // Expose Roster
        createTask, // Expose Creation
        createLocalContract,
        checkIn,
        checkOut,
        startTask,
        completeTask,
        unfocusTask,
        currentRiskLevel,
        setTasks,
        setShiftState,
        notifyActivity,
        lastActivityAt,
        reportObligations,
        reportSpecDrift,
        specDrifts,
        pressureMode,
        joinRemoteOperation,
        verifyPin,
        obligations,

        // PHASE B: Shift Intelligence
        shiftStart: activeWorkerId ? lastActivityAt : null,
        activeStaffCount: 1,
        shiftMetrics: calculateShiftLoad(
          tasks.filter((t) => t.status !== "done").length,
          1
        ),

        // PHASE D: Forecast
        forecast: {
          pressure: calculatePressure(
            (orders || []).filter(
              (o) => getNow() - new Date(o.createdAt).getTime() < 15 * 60 * 1000
            ).length || 0, // Last 15 min
            1, // Staff (Hardcoded 1 for now)
            10 // Avg Prep (Hardcoded 10 min)
          ),
          prediction: getShiftPrediction(new Date(getNow())),
        },
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

// EXPORTED PROVIDER (WRAPPER)
export const StaffProvider: React.FC<StaffProviderProps> = (props) => {
  return (
    <TrainingProvider>
      <StaffProviderInternal {...props} />
    </TrainingProvider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within StaffProvider");
  return context;
};

import { useEffect, useState } from "react";
import {
  createTask,
  Deal,
  DealActivity,
  deleteTask,
  fetchTasks,
  Task,
  updateTask,
} from "../services/database";
import ActivityTimeline from "./ActivityTimeline";
import FileUpload from "./FileUpload";

export default function DealDetail({
  deal,
  onClose,
}: {
  deal: Deal;
  onClose: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);

  useEffect(() => {
    loadTasks();
    loadActivities();
  }, [deal.id]);

  async function loadTasks() {
    const { data, error } = await fetchTasks(deal.user_id, {
      deal_id: deal.id,
    });
    if (!error) setTasks(data || []);
  }

  async function loadActivities() {
    // This would need to be added to database service
    // For now, using placeholder
    setActivities([]);
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;

    try {
      await createTask(deal.user_id, {
        deal_id: deal.id,
        title: newTaskTitle,
        due_date: newTaskDueDate || undefined,
        completed: false,
      });
      setNewTaskTitle("");
      setNewTaskDueDate("");
      await loadTasks();
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  }

  async function handleToggleTask(taskId: string, completed: boolean) {
    try {
      await updateTask(taskId, { completed: !completed });
      await loadTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{deal.title}</h2>
            <p className="text-gray-600 capitalize">Stage: {deal.stage}</p>
            {deal.amount && (
              <p className="text-lg font-semibold text-green-600">
                ${deal.amount.toFixed(2)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tasks Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tasks & Follow-ups</h3>
            <div className="space-y-2 mb-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p
                      className={
                        task.completed
                          ? "line-through text-gray-500"
                          : "text-gray-800"
                      }
                    >
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <ActivityTimeline activities={activities} />

          {/* File Upload */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Attachments</h3>
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {showFileUpload ? "Cancel" : "Upload"}
              </button>
            </div>
            {showFileUpload && <FileUpload dealId={deal.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

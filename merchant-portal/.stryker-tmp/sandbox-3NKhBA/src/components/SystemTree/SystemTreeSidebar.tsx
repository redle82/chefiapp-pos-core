/**
 * SystemTreeSidebar - Sidebar com Árvore Expansível
 *
 * 3 níveis: Executivo (resumido) | Operacional | Arquitetural (nerd)
 */
// @ts-nocheck


import type {
  SystemNode,
  SystemTreeViewLevel,
} from "../../context/SystemTreeContext";
import { useSystemTree } from "../../context/SystemTreeContext";

const VIEW_LABELS: Record<SystemTreeViewLevel, string> = {
  executive: "Resumido",
  operational: "Operacional",
  architectural: "Arquitetural",
};

export function SystemTreeSidebar() {
  const {
    nodes,
    expandedNodes,
    toggleExpand,
    selectNode,
    selectedNode,
    viewLevel,
    setViewLevel,
  } = useSystemTree();

  return (
    <div
      style={{
        width: "320px",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        overflowY: "auto",
        borderRight: "1px solid #3e3e3e",
        fontFamily: 'Monaco, Menlo, "Courier New", monospace',
        fontSize: "13px",
      }}
    >
      {/* Header + Nível de visão */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #3e3e3e",
          backgroundColor: "#252526",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          System Tree
        </h2>
        <p style={{ margin: "4px 0 12px", fontSize: "11px", color: "#858585" }}>
          Restaurant Operating System
        </p>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {(["executive", "operational", "architectural"] as const).map(
            (level) => (
              <button
                key={level}
                type="button"
                onClick={() => setViewLevel(level)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  border:
                    viewLevel === level
                      ? "1px solid #4ec9b0"
                      : "1px solid #3e3e3e",
                  borderRadius: "4px",
                  backgroundColor:
                    viewLevel === level ? "#4ec9b022" : "transparent",
                  color: viewLevel === level ? "#4ec9b0" : "#858585",
                  cursor: "pointer",
                }}
              >
                {VIEW_LABELS[level]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Tree */}
      <div style={{ padding: "8px 0" }}>
        {nodes.map((node) => (
          <RecursiveTreeNode
            key={node.id}
            node={node}
            level={0}
            expandedNodes={expandedNodes}
            selectedNode={selectedNode}
            onToggleExpand={toggleExpand}
            onSelect={selectNode}
          />
        ))}
      </div>
    </div>
  );
}

function RecursiveTreeNode({
  node,
  level,
  expandedNodes,
  selectedNode,
  onToggleExpand,
  onSelect,
}: {
  node: SystemNode;
  level: number;
  expandedNodes: Set<string>;
  selectedNode: SystemNode | null;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (node: SystemNode) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNode?.id === node.id;
  const indent = level * 16;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "installed":
      case "complete":
        return "#4ec9b0";
      case "inactive":
      case "not_installed":
      case "incomplete":
        return "#858585";
      case "locked":
        return "#f48771";
      case "dormant":
        return "#dcdcaa";
      case "observing":
        return "#569cd6";
      default:
        return "#858585";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "installed":
      case "complete":
        return "●";
      case "inactive":
      case "not_installed":
      case "incomplete":
        return "○";
      case "locked":
        return "🔒";
      case "dormant":
        return "💤";
      case "observing":
        return "👁️";
      default:
        return "○";
    }
  };

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand(node.id);
    }
    onSelect(node);
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          padding: "4px 8px",
          paddingLeft: `${indent + 8}px`,
          cursor: "pointer",
          backgroundColor: isSelected ? "#37373d" : "transparent",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          userSelect: "none",
          transition: "background-color 0.1s",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "#2a2d2e";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <span style={{ width: "12px", fontSize: "10px", color: "#858585" }}>
            {isExpanded ? "▼" : "▶"}
          </span>
        ) : (
          <span style={{ width: "12px" }} />
        )}

        {/* Status Icon */}
        <span
          style={{
            fontSize: "10px",
            color: getStatusColor(node.status),
          }}
        >
          {getStatusIcon(node.status)}
        </span>

        {/* Node Icon */}
        <span style={{ fontSize: "14px" }}>{node.icon}</span>

        {/* Label */}
        <span
          style={{
            flex: 1,
            color: isSelected ? "#ffffff" : "#d4d4d4",
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {node.label}
        </span>

        {/* Lock Icon */}
        {node.locked && (
          <span style={{ fontSize: "10px", color: "#f48771" }}>🔒</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <RecursiveTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              selectedNode={selectedNode}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

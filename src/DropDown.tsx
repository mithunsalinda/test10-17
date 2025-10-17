import React, { useMemo, useState } from "react";
import './editable-tree.css';
type NodeId = string;
export type TreeNode = {
  id: NodeId;
  label: string;
  readonly: boolean;
  children: TreeNode[];
};

const uid = () =>
  (typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2)) as string;

// Factory
const makeNode = (label = ""): TreeNode => ({ id: uid(), label, readonly: false, children: [] });
function mapNode(
  nodes: TreeNode[],
  targetId: NodeId,
  updater: (n: TreeNode) => TreeNode
): TreeNode[] {
  return nodes.map((n) =>
    n.id === targetId ? updater(n) : { ...n, children: mapNode(n.children, targetId, updater) }
  );
}

function removeNode(nodes: TreeNode[], targetId: NodeId): TreeNode[] {
  return nodes
    .filter((n) => n.id !== targetId)
    .map((n) => ({ ...n, children: removeNode(n.children, targetId) }));
}

function addChild(nodes: TreeNode[], parentId: NodeId, child: TreeNode): TreeNode[] {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, child] }
      : { ...n, children: addChild(n.children, parentId, child) }
  );
}

type NodeItemProps = {
  node: TreeNode;
  level: number;
  onChangeLabel: (id: NodeId, value: string) => void;
  onToggleReadonly: (id: NodeId) => void;
  onDelete: (id: NodeId) => void;
  onAddChild: (id: NodeId) => void;
};

const NodeItem: React.FC<NodeItemProps> = ({
  node,
  level,
  onChangeLabel,
  onToggleReadonly,
  onDelete,
  onAddChild,
}) => {
  const leftPad = useMemo(() => level * 16, [level]); 

  return (
    <div
      className="group relative mb-2"
      style={{ marginLeft: leftPad }}
      data-node-id={node.id}
    >
      <div className="flex items-center gap-2">
        <input
          className="w-72 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500"
          value={node.label}
          onChange={(e) => onChangeLabel(node.id, e.target.value)}
          placeholder={"Type here"}
          disabled={node.readonly}
        />

        {/* Hover actions */}
        <div className="pointer-events-none ml-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <label className="flex select-none items-center gap-1 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={node.readonly}
              onChange={() => onToggleReadonly(node.id)}
            />
            Read only
          </label>

          <button
            className={`rounded border px-2 py-1 text-xs ${
              node.readonly
                ? "cursor-not-allowed border-gray-200 text-gray-300"
                : "border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => onDelete(node.id)}
            disabled={node.readonly}
            title={node.readonly ? "Delete disabled while Read only" : "Delete"}
          >
            🗑
          </button>

          <button
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
            onClick={() => onAddChild(node.id)}
            title="Add child"
          >
            +
          </button>
        </div>
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="mt-2 border-l border-gray-200 pl-4">
          {node.children.map((c) => (
            <NodeItem
              key={c.id}
              node={c}
              level={level + 1}
              onChangeLabel={onChangeLabel}
              onToggleReadonly={onToggleReadonly}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function EditableTree() {
  const [tree, setTree] = useState<TreeNode[]>([]);

  // Actions
  const addRoot = () => setTree((t) => [...t, makeNode()]);
  const changeLabel = (id: NodeId, value: string) =>
    setTree((t) => mapNode(t, id, (n) => ({ ...n, label: value })));
  const toggleReadonly = (id: NodeId) =>
    setTree((t) => mapNode(t, id, (n) => ({ ...n, readonly: !n.readonly })));
  const deleteNodeById = (id: NodeId) => setTree((t) => removeNode(t, id));
  const addChildTo = (id: NodeId) => setTree((t) => addChild(t, id, makeNode()));

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-medium">Editable Tree</div>
        <div className="flex items-center gap-2">
          <button
            onClick={addRoot}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            title="Add root"
          >
            + Add root
          </button>
        </div>
      </div>

      {tree.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          No items yet. Click <span className="font-semibold">+ Add root</span> to begin.
        </div>
      ) : (
        <div>
          {tree.map((n) => (
            <NodeItem
              key={n.id}
              node={n}
              level={0}
              onChangeLabel={changeLabel}
              onToggleReadonly={toggleReadonly}
              onDelete={deleteNodeById}
              onAddChild={addChildTo}
            />
          ))}
        </div>
      )}
      <details className="mt-6 select-none text-xs text-gray-600">
        <summary className="cursor-pointer">Current JSON</summary>
        <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3">
          {JSON.stringify(tree, null, 2)}
        </pre>
      </details>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import "./editable-tree.css";

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


const makeNode = (label = ""): TreeNode => ({
  id: uid(),
  label,
  readonly: false,
  children: [],
});

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


const ROW_H = 36; 
const ROW_GAP = 8; 

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

  const childrenDirectH =
    node.children.length > 0
      ? node.children.length * (ROW_H + ROW_GAP) - ROW_GAP
      : 0;

  return (
    <div className="node" data-node-id={node.id}>
      <div className="nodeRow">
        <input
          className="nodeInput"
          value={node.label}
          onChange={(e) => onChangeLabel(node.id, e.target.value)}
          placeholder="Type here"
          disabled={node.readonly}
        />

        <div className="actions">
          <label className="readonlyToggle">
            <input
              type="checkbox"
              checked={node.readonly}
              onChange={() => onToggleReadonly(node.id)}
            />
            <span>Read only</span>
          </label>

          <button
            className={`btn btn--icon ${node.readonly ? "btn--disabled" : ""}`}
            onClick={() => onDelete(node.id)}
            disabled={node.readonly}
            title={node.readonly ? "Delete disabled while Read only" : "Delete"}
          >
            🗑
          </button>

          <button
            className="btn btn--icon"
            onClick={() => onAddChild(node.id)}
            title="Add child"
          >
            +
          </button>
        </div>
      </div>

      {node.children.length > 0 && (
        <div
          className="children"
          style={{ ["--direct-h" as any]: `${childrenDirectH}px` }}
        >
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

  const addRoot = () => setTree((t) => [...t, makeNode()]);
  const changeLabel = (id: NodeId, value: string) =>
    setTree((t) => mapNode(t, id, (n) => ({ ...n, label: value })));
  const toggleReadonly = (id: NodeId) =>
    setTree((t) => mapNode(t, id, (n) => ({ ...n, readonly: !n.readonly })));
  const deleteNodeById = (id: NodeId) => setTree((t) => removeNode(t, id));
  const addChildTo = (id: NodeId) => setTree((t) => addChild(t, id, makeNode()));
  const rootDirectH =
    tree.length > 0 ? tree.length * (ROW_H + ROW_GAP) - ROW_GAP : 0;

  return (
    <div className="editable-tree">
      <div className="toolbar">
        <div>
          <button onClick={addRoot} className="btn" title="Add root">
            + Add root
          </button>
        </div>
      </div>

      <div
        className="treeList"
        style={{ ["--direct-h" as any]: `${rootDirectH}px` }}
      >
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

      <details className="debug">
        <summary>Current JSON</summary>
        <pre>{JSON.stringify(tree, null, 2)}</pre>
      </details>
    </div>
  );
}

'use client';

import { forwardRef, useState } from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';
import { cn } from './cn';

const itemSize: Record<string, string> = {
  sm: 'h-ch-3 px-2 gap-1 text-[12px] leading-[16px]',
  md: 'h-ch-5 px-3 gap-2 text-[14px] leading-[20px]',
  lg: 'h-ch-7 px-4 gap-2 text-[16px] leading-[24px]',
};

const indentSize: Record<string, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const expandIconSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-1',
  lg: 'size-icon-2',
};

const iconSize: Record<string, string> = {
  sm: 'size-icon-1',
  md: 'size-icon-2',
  lg: 'size-icon-2',
};

type TreeNodeData = {
  id: string;
  label: string;
  children?: TreeNodeData[];
  icon?: React.ReactNode;
};

type TreeViewProps = React.HTMLAttributes<HTMLDivElement> & {
  data: TreeNodeData[];
  size?: 'sm' | 'md' | 'lg';
  selectedId?: string;
  onSelect?: (id: string) => void;
};

const TreeView = forwardRef<HTMLDivElement, TreeViewProps>(
  ({ data, size = 'md', selectedId, onSelect, className, ...props }, ref) => (
    <div ref={ref} role="tree" className={cn('flex flex-col', className)} {...props}>
      {data.map((node) => (
        <TreeNode key={node.id} node={node} size={size} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
);
TreeView.displayName = 'TreeView';

function TreeNode({ node, size = 'md', depth, selectedId, onSelect }: {
  node: TreeNodeData;
  size: 'sm' | 'md' | 'lg';
  depth: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const indent = depth * indentSize[size];

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect?.(node.id);
        }}
        className={cn(
          'flex items-center w-full cursor-pointer transition-colors',
          'hover:bg-surface-1 hover:text-on-surface',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          itemSize[size],
          isSelected ? 'bg-primary-container text-on-primary-container' : 'text-on-surface',
        )}
        style={{ paddingLeft: `${indent + (size === 'sm' ? 8 : size === 'md' ? 12 : 16)}px` }}
      >
        <span className={cn('shrink-0 transition-transform duration-200', expandIconSize[size], hasChildren ? '' : 'invisible')}>
          <ChevronRight className={cn('size-full', expanded && 'rotate-90')} />
        </span>
        <span className={cn('shrink-0', iconSize[size])}>
          {node.icon || (hasChildren ? <Folder className="size-full" /> : <File className="size-full" />)}
        </span>
        <span className="truncate">{node.label}</span>
      </button>
      {hasChildren && expanded && (
        <div role="group">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} size={size} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export { TreeView };
export type { TreeNodeData };

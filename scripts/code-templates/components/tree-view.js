const { filterSizes, textRoleClass } = require('./helpers');

function generateTreeView(name, config, meta) {
  const sizes = filterSizes(config.sizes);

  // Build item size classes
  const itemSizeEntries = {};
  const indentSizeEntries = {};
  const expandIconSizeEntries = {};
  const iconSizeEntries = {};

  for (const [tier, sz] of Object.entries(sizes)) {
    if (tier.startsWith('$')) continue;

    // Item height + padding + gap + font
    const classes = [];
    if (sz['item-height']) {
      const h = sz['item-height'].replace('height/', '');
      classes.push(`h-${h}`);
    }
    const pxMatch = sz['x-padding']?.match(/\{scale\.(\d+)\}/);
    if (pxMatch) classes.push(`px-${pxMatch[1]}`);
    const gapMatch = sz.gap?.match(/\{scale\.(\d+)\}/);
    if (gapMatch) classes.push(`gap-${gapMatch[1]}`);
    const roleCls = textRoleClass(sz.text);
    if (roleCls) classes.push(roleCls);
    itemSizeEntries[tier] = classes.join(' ');

    // Indent per depth level (raw number for style calc)
    const indentMatch = sz.indent?.match(/\{scale\.(\d+)\}/);
    indentSizeEntries[tier] = indentMatch ? parseInt(indentMatch[1]) * 4 : 20;

    // Expand icon size
    if (sz['expand-icon']) {
      expandIconSizeEntries[tier] = `size-${sz['expand-icon'].replace('icon/', '')}`;
    }

    // Node icon size
    if (sz['icon-size']) {
      iconSizeEntries[tier] = `size-${sz['icon-size'].replace('icon/', '')}`;
    }
  }

  // Item states for selected styling
  const itemStates = config.item?.state || {};
  const selectedState = itemStates.selected || {};
  const selectedBg = selectedState.bg ? selectedState.bg.split('/').pop() : 'primary-container';
  const selectedFg = selectedState.fg ? selectedState.fg.split('/').pop() : 'on-primary-container';

  return `'use client';

import { forwardRef, useState } from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';
import { cn } from './cn';

const itemSize: Record<string, string> = {
${Object.entries(itemSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const indentSize: Record<string, number> = {
${Object.entries(indentSizeEntries).map(([k, v]) => `  ${k}: ${v},`).join('\n')}
};

const expandIconSize: Record<string, string> = {
${Object.entries(expandIconSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
};

const iconSize: Record<string, string> = {
${Object.entries(iconSizeEntries).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
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
  ({ data, size = '${config.default?.size || 'md'}', selectedId, onSelect, className, ...props }, ref) => (
    <div ref={ref} role="tree" className={cn('flex flex-col', className)} {...props}>
      {data.map((node) => (
        <TreeNode key={node.id} node={node} size={size} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
);
TreeView.displayName = 'TreeView';

function TreeNode({ node, size = '${config.default?.size || 'md'}', depth, selectedId, onSelect }: {
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
          isSelected ? 'bg-${selectedBg} text-${selectedFg}' : 'text-on-surface',
        )}
        style={{ paddingLeft: \`\${indent + (size === 'sm' ? 8 : size === 'md' ? 12 : 16)}px\` }}
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
`;
}

module.exports = { generateTreeView };

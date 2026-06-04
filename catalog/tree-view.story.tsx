import { TreeView } from '../components/atoms/TreeView';
import type { TreeNodeData } from '../components/atoms/TreeView';

const sampleData: TreeNodeData[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'input', label: 'Input.tsx' },
          { id: 'card', label: 'Card.tsx' },
        ],
      },
      {
        id: 'hooks',
        label: 'hooks',
        children: [
          { id: 'use-theme', label: 'useTheme.ts' },
          { id: 'use-media', label: 'useMediaQuery.ts' },
        ],
      },
      { id: 'app', label: 'App.tsx' },
      { id: 'index', label: 'index.ts' },
    ],
  },
  { id: 'package', label: 'package.json' },
  { id: 'readme', label: 'README.md' },
];

const TreeViewDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-sm">
      <TreeView data={sampleData} size={size} />
    </div>
  );
};

export const treeviewStory = {
  component: TreeViewDemo,
  name: 'Tree View',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};

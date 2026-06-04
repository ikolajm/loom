import { FileUpload } from '../components/atoms/FileUpload';

const FileUploadDemo = ({ variant = 'default', size = 'md' }: { variant?: 'default' | 'dragover'; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="w-full max-w-md">
      <FileUpload variant={variant} size={size} onFilesSelected={(files) => console.log('Files:', files)} />
    </div>
  );
};

export const fileuploadStory = {
  component: FileUploadDemo,
  name: 'File Upload',
  defaultProps: {
    variant: 'default',
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'variant', label: 'Variant', options: ['default', 'dragover'] },
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};

import { FormField } from '../components/atoms/FormField';
import { Label } from '../components/atoms/Label';
import { Input } from '../components/atoms/Input';
import { HelperText } from '../components/atoms/HelperText';
import { Checkbox } from '../components/atoms/Checkbox';
import { Switch } from '../components/atoms/Switch';

const FormFieldDemo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="flex flex-col gap-section w-full max-w-sm">
      <FormField>
        <Label size={size}>Email address</Label>
        <Input size={size} placeholder="you@example.com" />
        <HelperText size={size}>We\'ll never share your email.</HelperText>
      </FormField>

      <FormField error>
        <Label size={size}>Username</Label>
        <Input size={size} state="error" placeholder="Enter username" />
        <HelperText size={size} state="error">Username is already taken.</HelperText>
      </FormField>

      <FormField>
        <div className="flex items-start gap-component-compact">
          <Checkbox size={size} />
          <div className="flex flex-col gap-0.5">
            <Label size={size}>Accept terms and conditions</Label>
            <HelperText size={size}>You must agree before submitting.</HelperText>
          </div>
        </div>
      </FormField>

      <FormField>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label size={size}>Push notifications</Label>
            <HelperText size={size}>Receive alerts on your device.</HelperText>
          </div>
          <Switch size={size} />
        </div>
      </FormField>
    </div>
  );
};

export const formfieldStory = {
  component: FormFieldDemo,
  name: 'Form Field',
  defaultProps: {
    size: 'md',
  },
  controls: [
    { type: 'select' as const, prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'] },
  ],
};

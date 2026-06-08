import { forwardRef, createContext, useContext } from 'react';
import { cn } from './cn';

type FormFieldContextValue = {
  error?: boolean;
};

const FormFieldContext = createContext<FormFieldContextValue>({});

const useFormField = () => useContext(FormFieldContext);

// Resolve a control's error state: an explicit prop wins, else cascade from FormFieldContext.
// One home for the cascade semantics, shared by every form control.
const useFieldError = (explicit?: boolean): boolean => {
  const { error } = useFormField();
  return explicit ?? error ?? false;
};

type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  error?: boolean;
};

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ error, className, children, ...props }, ref) => (
    <FormFieldContext.Provider value={{ error }}>
      <div ref={ref} className={cn('flex flex-col gap-component-compact', className)} {...props}>
        {children}
      </div>
    </FormFieldContext.Provider>
  )
);
FormField.displayName = 'FormField';

export { FormField, useFormField, useFieldError };

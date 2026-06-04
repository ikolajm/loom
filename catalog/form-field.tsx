import { forwardRef, createContext, useContext } from 'react';
import { cn } from './cn';

type FormFieldContextValue = {
  error?: boolean;
};

const FormFieldContext = createContext<FormFieldContextValue>({});

const useFormField = () => useContext(FormFieldContext);

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

export { FormField, useFormField };

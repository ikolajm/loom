const { cls } = require('../shared');

/**
 * The three selection controls, all of them a native input with a class on it.
 *
 * There is no wrapper and no mark element on purpose. The box, the tick and the circle are
 * the UA's, pointed at the brand by accent-color; the switch is drawn by the class layer as
 * a track and a gradient thumb. So each of these files is thin by design, and the honest
 * question for each is what it carries that the class alone does not.
 *
 *   Checkbox  indeterminate. It is a DOM property with no attribute and no selector, so it
 *             cannot be set from JSX or reached from CSS. This is the one control here that
 *             would need a file even if nothing else did.
 *   Radio     the exclusive-group semantics are the browser's, given a shared name. What
 *             this adds is the size ladder and the validity cascade, same as its sibling.
 *   Switch    role="switch", which is the whole difference between a switch and a checkbox
 *             as far as a screen reader is concerned, and easy to leave off by hand.
 *
 * None of them takes .interactive. That class carries a hover overlay drawn with ::after,
 * and an <input> is a replaced element that renders no pseudo-element — so it would be a
 * class that looks applied and does nothing. .control is what they need: the disabled
 * treatment and the validity hook.
 */

const props = (name, extra) => `type ${name}Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;${extra || ''}
};`;

function generateCheckbox(_name, _config, def) {
  return `import { forwardRef, useEffect, useRef } from 'react';
import { cn } from './cn';
import { useFieldError } from './form-field';

${props('Checkbox', `
  /** Renders the mixed state. A DOM property, not an attribute — see below. */
  indeterminate?: boolean;`)}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ size = '${def.defaultSize || 'md'}', error, indeterminate = false, className, ...props }, ref) => {
    const hasError = useFieldError(error);
    const own = useRef<HTMLInputElement | null>(null);

    // The only reason this component is a file. indeterminate has no attribute and no
    // selector: it is settable on the element and nowhere else, so JSX cannot express it
    // and neither can the class layer.
    useEffect(() => {
      if (own.current) own.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <input
        type="checkbox"
        ref={(node) => {
          own.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn('${cls('checkbox control', 'checkbox')}', className)}
        data-size={size}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
`;
}

function generateRadio(_name, _config, def) {
  return `import { forwardRef } from 'react';
import { cn } from './cn';
import { useFieldError } from './form-field';

${props('Radio')}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ size = '${def.defaultSize || 'md'}', error, className, ...props }, ref) => {
    const hasError = useFieldError(error);
    return (
      <input
        type="radio"
        ref={ref}
        className={cn('${cls('radio control', 'radio')}', className)}
        data-size={size}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);
Radio.displayName = 'Radio';

export { Radio };
`;
}

function generateSwitch(_name, _config, def) {
  return `import { forwardRef } from 'react';
import { cn } from './cn';
import { useFieldError } from './form-field';

${props('Switch')}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ size = '${def.defaultSize || 'md'}', error, className, ...props }, ref) => {
    const hasError = useFieldError(error);
    return (
      // A checkbox underneath, because the behaviour is identical and the browser already
      // has it. role="switch" is what makes it announce as on/off rather than checked, and
      // it is the difference a hand-rolled one forgets.
      <input
        type="checkbox"
        role="switch"
        ref={ref}
        className={cn('${cls('switch control', 'switch')}', className)}
        data-size={size}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
`;
}

module.exports = { generateCheckbox, generateRadio, generateSwitch };

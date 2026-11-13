import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldShellProps) {
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      {label ? (
        <label htmlFor={htmlFor}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <span className="field-error" id={htmlFor ? `${htmlFor}-help` : undefined} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint" id={htmlFor ? `${htmlFor}-help` : undefined}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, required, ...rest }: InputProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <input
        id={inputId}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-help` : undefined}
        required={required}
        {...rest}
      />
    </Field>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, id, required, ...rest }: TextareaProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <textarea
        id={inputId}
        className="textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-help` : undefined}
        required={required}
        {...rest}
      />
    </Field>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export function Select({ label, hint, error, id, required, options, placeholder, ...rest }: SelectProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <select
        id={inputId}
        className="select"
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-help` : undefined}
        required={required}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
}

export function Checkbox({ label, error, id, ...rest }: CheckboxProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div>
      <label className="checkbox" htmlFor={inputId}>
        <input id={inputId} type="checkbox" aria-invalid={error ? true : undefined} {...rest} />
        <span>{label}</span>
      </label>
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export function Switch({ label, description, id, ...rest }: SwitchProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="switch-row">
      <div>
        <div className="strong">{label}</div>
        {description ? <div className="field-hint">{description}</div> : null}
      </div>
      <label className="switch">
        <input id={inputId} type="checkbox" aria-label={label} {...rest} />
        <span aria-hidden="true" />
      </label>
    </div>
  );
}

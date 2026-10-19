import { useLang } from '../../context/LangContext';
import { Field, TextInput, Select } from '../common/Input';
import { fieldErrorText, todayInput } from '../../utils/format';

export const isVisible = (f, v) => !f.showIf || f.showIf.in.includes(v[f.showIf.field]);

export function initialValues(fields, saved) {
  const v = {};
  for (const f of fields) {
    if (saved && saved[f.name] !== undefined) v[f.name] = String(saved[f.name]);
    else if (f.kind === 'date') v[f.name] = todayInput();
    else v[f.name] = f.default !== undefined ? String(f.default) : '';
  }
  return v;
}

// Client-side checks mirror the server rules; the server remains the source of truth.
export function validateClient(fields, v) {
  const errors = {};
  for (const f of fields) {
    if (!isVisible(f, v)) continue;
    const val = String(v[f.name] ?? '').trim();
    if (!val) { if (f.required) errors[f.name] = { code: 'required' }; continue; }
    if (f.kind === 'number') {
      const n = Number(val.replace(',', '.'));
      const max = f.maxByField?.map[v[f.maxByField.field]] ?? f.max;
      if (!Number.isFinite(n)) errors[f.name] = { code: 'number' };
      else if (n < 0) errors[f.name] = { code: 'negative' };
      else if (n < f.min) errors[f.name] = { code: 'min', params: { min: f.min } };
      else if (n > max) errors[f.name] = { code: 'max', params: { max } };
      else if (f.integer && !Number.isInteger(n)) errors[f.name] = { code: 'integer' };
    }
    if (f.kind === 'date' && val > todayInput()) errors[f.name] = { code: 'future' };
  }
  return errors;
}

export function DynamicForm({ fields, values, errors, onChange, idPrefix = 'field' }) {
  const { t, pick } = useLang();
  const set = (name, value) => {
    const next = { ...values, [name]: value };
    for (const f of fields) {
      if (f.kind !== 'select') continue;
      const allowed = f.options.filter((o) => !o.onlyIf || o.onlyIf.in.includes(next[o.onlyIf.field]));
      if (!allowed.some((o) => o.value === next[f.name])) next[f.name] = allowed[0]?.value ?? '';
    }
    onChange(next, name);
  };
  const visible = fields.filter((f) => isVisible(f, values));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {visible.map((f) => {
        const id = `${idPrefix}-${f.name}`;
        const unit = f.unitByField ? pick(f.unitByField.map[values[f.unitByField.field]]) : pick(f.unit);
        const max = f.maxByField?.map[values[f.maxByField.field]] ?? f.max;
        const wide = f.kind === 'select' && f.options.some((o) => pick(o.label).length > 24);
        return (
          <div key={f.name} className={wide || f.kind === 'text' ? 'sm:col-span-2' : ''}>
            <Field label={pick(f.label)} htmlFor={id} required={f.required} optionalLabel={t('common.optional')} unit={unit} helper={pick(f.helper)} error={fieldErrorText(errors[f.name], t)}>
              {f.kind === 'select' ? (
                <Select id={id} value={values[f.name]} error={errors[f.name]} onChange={(e) => set(f.name, e.target.value)} data-testid={`input-${f.name}`}>
                  {f.options.filter((o) => !o.onlyIf || o.onlyIf.in.includes(values[o.onlyIf.field])).map((o) => <option key={o.value} value={o.value}>{pick(o.label)}</option>)}
                </Select>
              ) : (
                <TextInput id={id} value={values[f.name]} error={errors[f.name]} onChange={(e) => set(f.name, e.target.value)} data-testid={`input-${f.name}`}
                  type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'} inputMode={f.kind === 'number' ? 'decimal' : undefined}
                  min={f.kind === 'number' ? f.min : undefined} max={f.kind === 'number' ? max : f.kind === 'date' ? todayInput() : undefined} step={f.step}
                  maxLength={f.maxLength} placeholder={f.placeholder ? String(f.placeholder) : undefined} />
              )}
            </Field>
          </div>
        );
      })}
    </div>
  );
}

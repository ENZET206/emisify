import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, CalendarDays, Mail, Lock, KeyRound, Trash2, ShieldCheck, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, BackButton, IconTile } from '../../components/common/Page';
import { Field, TextInput } from '../../components/common/Input';
import { PasswordInput } from '../../components/common/AuthShell';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ErrorMessage } from '../../components/common/Feedback';
import { fieldErrorText, formatDate } from '../../utils/format';

// Same rules as the register form / server strongPassword().
function passwordError(p) {
  if (!p) return { code: 'required' };
  if (p.length < 8) return { code: 'passwordMin' };
  if (!/[A-Za-z]/.test(p)) return { code: 'passwordLetter' };
  if (!/\d/.test(p)) return { code: 'passwordNumber' };
  return null;
}

// Shared submit flow: client-side errors → API call → field errors from the server or a general error.
function useFormSubmit() {
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async (clientErrors, fn) => {
    setErrors(clientErrors);
    setApiError(null);
    if (Object.keys(clientErrors).length) return;
    setLoading(true);
    try { await fn(); } catch (err) {
      if (err.details?.fields) setErrors(err.details.fields);
      else setApiError(err);
    } finally { setLoading(false); }
  };
  const clear = (k) => setErrors((x) => ({ ...x, [k]: undefined }));
  return { errors, apiError, loading, run, clear };
}

function Section({ icon, tone, title, children, testId, className = '' }) {
  return (
    <section className={`surface rounded-[2rem] p-5 sm:p-6 ${className}`} data-testid={testId}>
      <div className="mb-5 flex items-center gap-3"><IconTile icon={icon} tone={tone} size="sm" /><h2 className="text-lg font-bold">{title}</h2></div>
      {children}
    </section>
  );
}

function ProfileForm() {
  const { t, lang } = useLang();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name || '', age: user.age != null ? String(user.age) : '' });
  const { errors, apiError, loading, run, clear } = useFormSubmit();
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); clear(k); };

  const submit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const age = form.age === '' ? null : Number(form.age);
    const errs = {};
    if (!name) errs.name = { code: 'required' };
    else if (name.length < 2) errs.name = { code: 'nameMin' };
    if (age !== null) {
      if (!Number.isInteger(age)) errs.age = { code: 'integer' };
      else if (age < 10) errs.age = { code: 'ageMin' };
      else if (age > 100) errs.age = { code: 'ageMax' };
    }
    if (!Object.keys(errs).length && name === user.name && age === (user.age ?? null)) {
      toast.info(t('profile.noChanges'));
      return;
    }
    run(errs, async () => {
      const d = await api.patch('/user/profile', { name, age });
      setUser(d.user);
      toast.success(t('profile.saved'));
    });
  };

  const err = (k) => fieldErrorText(errors[k], t);
  return (
    <Section icon={UserRound} title={t('profile.infoTitle')} testId="profile-info-section">
      <form onSubmit={submit} noValidate className="space-y-4" data-testid="profile-form">
        <Field label={t('auth.name')} htmlFor="profile-name" error={err('name')} required>
          <TextInput id="profile-name" autoComplete="name" icon={UserRound} value={form.name} onChange={set('name')} error={errors.name} maxLength={60} data-testid="profile-name-input" />
        </Field>
        <Field label={t('auth.age')} htmlFor="profile-age" error={err('age')} optionalLabel={t('common.optional')}>
          <TextInput id="profile-age" type="number" inputMode="numeric" min="10" max="100" icon={CalendarDays} placeholder={t('auth.agePh')} value={form.age} onChange={set('age')} error={errors.age} data-testid="profile-age-input" />
        </Field>
        <Field label={t('profile.email')} htmlFor="profile-email" helper={t('profile.emailNote')}>
          <TextInput id="profile-email" type="email" icon={Mail} value={user.email} readOnly disabled className="cursor-not-allowed bg-cream/60 text-muted" data-testid="profile-email-input" />
        </Field>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          {user.createdAt && <span className="rounded-full bg-cream px-3 py-1">{t('profile.joined', { date: formatDate(user.createdAt, lang) })}</span>}
          {user.googleLinked && <span className="rounded-full bg-mint px-3 py-1 text-forest" data-testid="profile-google-badge">{t('profile.google')}</span>}
        </div>
        {apiError && <ErrorMessage error={apiError} />}
        <div className="flex justify-end"><Button type="submit" icon={Save} loading={loading} data-testid="profile-save-button">{t('common.save')}</Button></div>
      </form>
    </Section>
  );
}

function PasswordForm() {
  const { t } = useLang();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const hasPassword = user.hasPassword;
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const { errors, apiError, loading, run, clear } = useFormSubmit();
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); clear(k); };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (hasPassword && !form.currentPassword) errs.currentPassword = { code: 'required' };
    const pe = passwordError(form.newPassword);
    if (pe) errs.newPassword = pe;
    if (!form.confirm) errs.confirm = { code: 'required' };
    else if (form.confirm !== form.newPassword) errs.confirm = { code: 'passwordMismatch' };
    run(errs, async () => {
      const body = { newPassword: form.newPassword, ...(hasPassword ? { currentPassword: form.currentPassword } : {}) };
      const d = await api.patch('/user/password', body);
      setUser(d.user);
      setForm(empty);
      toast.success(t('profile.passwordChanged'));
    });
  };

  const err = (k) => fieldErrorText(errors[k], t);
  return (
    <Section icon={ShieldCheck} tone="bg-mint text-forest" title={t('profile.securityTitle')} testId="profile-security-section">
      <form onSubmit={submit} noValidate className="space-y-4" data-testid="password-form">
        <p className="text-sm text-muted">{t(hasPassword ? 'profile.changePasswordHelp' : 'profile.setPasswordHelp')}</p>
        {hasPassword && (
          <Field label={t('profile.currentPassword')} htmlFor="current-password" error={err('currentPassword')} required>
            <PasswordInput id="current-password" autoComplete="current-password" icon={Lock} value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} data-testid="current-password-input" />
          </Field>
        )}
        <Field label={t('auth.newPassword')} htmlFor="new-password" error={err('newPassword')} helper={t('auth.passwordHint')} required>
          <PasswordInput id="new-password" autoComplete="new-password" icon={KeyRound} value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} data-testid="new-password-input" />
        </Field>
        <Field label={t('auth.confirmPassword')} htmlFor="confirm-password" error={err('confirm')} required>
          <PasswordInput id="confirm-password" autoComplete="new-password" icon={KeyRound} value={form.confirm} onChange={set('confirm')} error={errors.confirm} data-testid="confirm-password-input" />
        </Field>
        {apiError && <ErrorMessage error={apiError} />}
        <div className="flex justify-end">
          <Button type="submit" variant="forest" icon={KeyRound} loading={loading} data-testid="password-save-button">{t(hasPassword ? 'profile.changePassword' : 'profile.setPassword')}</Button>
        </div>
      </form>
    </Section>
  );
}

function DeleteAccountModal({ open, onClose }) {
  const { t } = useLang();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const hasPassword = user.hasPassword;
  const [value, setValue] = useState('');
  const { errors, apiError, loading, run, clear } = useFormSubmit();
  const field = hasPassword ? 'password' : 'confirmEmail';

  const submit = (e) => {
    e?.preventDefault();
    const v = hasPassword ? value : value.trim().toLowerCase();
    const errs = {};
    if (!v) errs[field] = { code: 'required' };
    else if (!hasPassword && v !== user.email) errs[field] = { code: 'emailMismatch' };
    run(errs, async () => {
      await api.del('/user', { [field]: v });
      toast.info(t('profile.deleted'));
      nav('/', { replace: true });
      setUser(null);
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={t('profile.deleteTitle')} size="sm" testId="delete-account-dialog"
      footer={(
        <>
          <Button variant="outline" onClick={onClose} data-testid="delete-account-cancel">{t('common.cancel')}</Button>
          <Button variant="dangerSolid" icon={Trash2} loading={loading} onClick={submit} data-testid="delete-account-confirm">{t('profile.deleteConfirm')}</Button>
        </>
      )}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-[15px] leading-relaxed text-muted">{t('profile.dangerBody')}</p>
        <Field label={hasPassword ? t('auth.password') : t('profile.email')} htmlFor="delete-confirm" required
          error={fieldErrorText(errors[field], t)} helper={hasPassword ? t('profile.deletePasswordHelp') : t('profile.deleteEmailHelp', { email: user.email })}>
          {hasPassword ? (
            <PasswordInput id="delete-confirm" autoComplete="current-password" icon={Lock} value={value} error={errors[field]}
              onChange={(e) => { setValue(e.target.value); clear(field); }} data-testid="delete-account-input" />
          ) : (
            <TextInput id="delete-confirm" type="email" autoComplete="off" icon={Mail} value={value} error={errors[field]}
              onChange={(e) => { setValue(e.target.value); clear(field); }} data-testid="delete-account-input" />
          )}
        </Field>
        {apiError && <ErrorMessage error={apiError} />}
      </form>
    </Modal>
  );
}

export default function ProfilePage() {
  const { t } = useLang();
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <div className="mb-4"><BackButton /></div>
      <PageHeader title={t('profile.title')} subtitle={t('profile.sub')} testId="profile-title" />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ProfileForm />
        <div className="space-y-6">
          <PasswordForm />
          <Section icon={Trash2} tone="bg-[#FDECEA] text-danger" title={t('profile.dangerTitle')} testId="profile-danger-section" className="border border-danger/20">
            <p className="text-sm text-muted">{t('profile.dangerBody')}</p>
            <div className="mt-4 flex justify-end">
              <Button variant="danger" icon={Trash2} onClick={() => setDeleting(true)} data-testid="delete-account-button">{t('profile.deleteButton')}</Button>
            </div>
          </Section>
        </div>
      </div>
      {deleting && <DeleteAccountModal open={deleting} onClose={() => setDeleting(false)} />}
    </>
  );
}

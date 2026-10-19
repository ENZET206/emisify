const { z } = require('zod');

const email = z.string({ required_error: 'required' }).trim().toLowerCase().min(1, 'required').max(120, 'maxLength').email('email');

function strongPassword() {
  return z.string({ required_error: 'required' }).min(8, 'passwordMin').max(72, 'maxLength')
    .regex(/[A-Za-z]/, 'passwordLetter').regex(/\d/, 'passwordNumber');
}

const register = z.object({
  name: z.string({ required_error: 'required' }).trim().min(2, 'nameMin').max(60, 'maxLength'),
  age: z.coerce.number({ invalid_type_error: 'number' }).int('integer').min(10, 'ageMin').max(100, 'ageMax').optional(),
  email,
  password: strongPassword(),
});

const login = z.object({
  email,
  password: z.string({ required_error: 'required' }).min(1, 'required').max(72, 'maxLength'),
});

const googleUrl = z.object({ redirectUri: z.string().url().max(300) });
const googleCallback = z.object({ code: z.string().min(1).max(2000), state: z.string().min(1).max(100), redirectUri: z.string().url().max(300) });
const forgot = z.object({ email, lang: z.enum(['id', 'en']).default('id') });
const reset = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'invalidToken'), password: strongPassword() });
const target = z.object({ monthlyTargetKg: z.number({ invalid_type_error: 'number' }).min(1, 'min').max(100000, 'max').nullable() });

module.exports = { register, login, googleUrl, googleCallback, forgot, reset, target };

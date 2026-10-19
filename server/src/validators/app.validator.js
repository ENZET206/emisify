const { z } = require('zod');

const calculationBody = z.object({
  activity: z.string().min(1, 'required').max(30),
  subType: z.string().min(1, 'required').max(30),
  inputs: z.record(z.any()).refine((o) => Object.keys(o).length <= 20, 'tooManyFields'),
});

const calculationUpdate = z.object({
  inputs: z.record(z.any()).refine((o) => Object.keys(o).length <= 20, 'tooManyFields'),
});

const listQuery = z.object({
  category: z.enum(['ALL', 'TRANSPORT', 'ELECTRICITY', 'AC', 'ELECTRONICS']).default('ALL'),
  range: z.enum(['all', '7d', '30d', 'month', 'lastMonth']).default('all'),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest'),
});

const impactQuery = z.object({ range: z.enum(['all', '30d', 'month']).default('month') });

const recommendationStatus = z.object({ status: z.enum(['SAVED', 'IN_PROGRESS', 'DONE', 'NONE']) });

const aiChat = z.object({
  message: z.string().trim().min(1, 'required').max(500, 'maxLength'),
  recommendationId: z.string().max(40).optional().nullable(),
  lang: z.enum(['id', 'en']).default('id'),
});

module.exports = { calculationBody, calculationUpdate, listQuery, impactQuery, recommendationStatus, aiChat };

import { z } from 'zod';

export const StatusEnum = z.enum(['completed','in-review','in-progress','to-be-defined']);

export const CreateThemeBody = z.object({
  name: z.string().min(1).max(120),
});

export const UpdateThemeBody = z.object({
  name: z.string().min(1).max(120),
});

export const CreateItemBody = z.object({
  themeId:      z.string().uuid(),
  name:         z.string().min(1).max(200),
  start:        z.number().int().min(0).max(11),
  end:          z.number().int().min(0).max(11),
  status:       StatusEnum,
  sub:          z.string().max(300).default(''),
  desc:         z.string().max(2000).default(''),
  ongoingEnd:   z.number().int().min(0).max(11).optional(),
  ongoingLabel: z.string().max(500).optional(),
});

export const UpdateItemBody = z.object({
  themeId:      z.string().uuid().optional(),
  name:         z.string().min(1).max(200).optional(),
  start:        z.number().int().min(0).max(11).optional(),
  end:          z.number().int().min(0).max(11).optional(),
  status:       StatusEnum.optional(),
  sub:          z.string().max(300).optional(),
  desc:         z.string().max(2000).optional(),
  ongoingEnd:   z.number().int().min(0).max(11).nullable().optional(),
  ongoingLabel: z.string().max(500).nullable().optional(),
  position:     z.number().int().min(0).optional(),
});

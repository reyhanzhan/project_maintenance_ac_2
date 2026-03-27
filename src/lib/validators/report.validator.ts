import { z } from "zod";

export const reportUploadSchema = z.object({
  hospitalId: z.coerce.number().int().positive(),
  acUnitId: z.coerce.number().int().positive(),
  note: z.string().max(1000).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export type ReportUploadInput = z.infer<typeof reportUploadSchema>;

import { z } from 'zod';
import { LabSubmissionSchema } from '../lab_submissions/types';

export const StudentSubmissionOverviewSchema = z.object({
  username: z.string(),
  totalSubmissions: z.number().int().min(0),
  submissions: z.array(LabSubmissionSchema),
});

export const CourseLabSubmissionsOverviewResponseSchema = z.object({
  success: z.boolean(),
  labTitle: z.string().optional(),
  students: z.array(StudentSubmissionOverviewSchema).optional(),
  message: z.string().optional(),
});

export type StudentSubmissionOverview = z.infer<typeof StudentSubmissionOverviewSchema>;
export type CourseLabSubmissionsOverviewResponse = z.infer<
  typeof CourseLabSubmissionsOverviewResponseSchema
>;

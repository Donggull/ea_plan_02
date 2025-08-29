import { z } from 'zod'

// 기본 인증 스키마들
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요')
      .email('올바른 이메일 형식이 아닙니다'),
    password: z
      .string()
      .min(6, '비밀번호는 최소 6자 이상이어야 합니다')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대소문자와 숫자를 포함해야 합니다'),
    confirmPassword: z
      .string()
      .min(1, '비밀번호 확인을 입력해주세요'),
    name: z
      .string()
      .min(1, '이름을 입력해주세요')
      .min(2, '이름은 최소 2자 이상이어야 합니다'),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, '서비스 이용약관에 동의해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
})

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, '비밀번호는 최소 6자 이상이어야 합니다')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대소문자와 숫자를 포함해야 합니다'),
    confirmPassword: z
      .string()
      .min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

// 조직 생성 스키마
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, '조직명을 입력해주세요')
    .min(2, '조직명은 최소 2자 이상이어야 합니다')
    .max(50, '조직명은 최대 50자까지 입력할 수 있습니다'),
  slug: z
    .string()
    .min(1, '조직 URL을 입력해주세요')
    .min(3, '조직 URL은 최소 3자 이상이어야 합니다')
    .max(30, '조직 URL은 최대 30자까지 입력할 수 있습니다')
    .regex(/^[a-z0-9-]+$/, '조직 URL은 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
      message: '조직 URL은 하이픈(-)으로 시작하거나 끝날 수 없습니다',
    }),
  description: z
    .string()
    .max(200, '설명은 최대 200자까지 입력할 수 있습니다')
    .optional(),
  website_url: z
    .string()
    .url('올바른 URL 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  contact_email: z
    .string()
    .email('올바른 이메일 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  contact_phone: z
    .string()
    .regex(/^[0-9-+\s()]+$/, '올바른 전화번호 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  timezone: z
    .string(),
  subscription_tier: z
    .enum(['free', 'starter', 'pro', 'enterprise']),
})

// 팀원 초대 스키마
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  role: z
    .enum(['owner', 'admin', 'member', 'viewer']),
  message: z
    .string()
    .max(500, '메시지는 최대 500자까지 입력할 수 있습니다')
    .optional(),
})

export const inviteMultipleSchema = z.object({
  members: z
    .array(inviteMemberSchema)
    .min(1, '최소 1명 이상의 팀원을 초대해주세요')
    .max(10, '한 번에 최대 10명까지 초대할 수 있습니다'),
})

// 프로필 업데이트 스키마
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 최대 50자까지 입력할 수 있습니다'),
  avatar_url: z
    .string()
    .url('올바른 URL 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
})

// 타입 추론
export type SignInData = z.infer<typeof signInSchema>
export type SignUpData = z.infer<typeof signUpSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>
export type OrganizationData = z.infer<typeof organizationSchema>
export type InviteMemberData = z.infer<typeof inviteMemberSchema>
export type InviteMultipleData = z.infer<typeof inviteMultipleSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>

// 회원가입 시 조직 데이터와 함께 사용할 타입
export type CreateOrgData = OrganizationData & {
  user: {
    email: string
    password: string
    name: string
  }
}
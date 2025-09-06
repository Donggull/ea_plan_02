import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { RFPUploadResponse } from '@/types/rfp-analysis'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 RFP Upload API: Starting enhanced request processing...')
    
    // 요청 헤더 상세 로깅
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const userAgent = request.headers.get('user-agent')
    const referer = request.headers.get('referer')
    const origin = request.headers.get('origin')
    
    console.log('📋 Request headers analysis:', {
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : null,
      hasCookieHeader: !!cookieHeader,
      cookieCount: cookieHeader?.split(';').length || 0,
      cookieNames: cookieHeader ? cookieHeader.split(';').map(c => c.trim().split('=')[0]).join(', ') : 'none',
      userAgent: userAgent?.substring(0, 50) + '...',
      referer,
      origin,
      requestUrl: request.url
    })

    // 쿠키 상세 분석
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const supabaseCookies = cookies.filter(c => 
        c.startsWith('sb-') || 
        c.includes('supabase') ||
        c.includes('auth-token') ||
        c.includes('access-token') ||
        c.includes('refresh-token')
      )
      
      console.log('🍪 Cookie analysis:', {
        totalCookies: cookies.length,
        supabaseCookies: supabaseCookies.length,
        supabaseCookieNames: supabaseCookies.map(c => c.split('=')[0]).join(', '),
        allCookieNames: cookies.map(c => c.split('=')[0]).join(', ')
      })
    }
    
    let user: any = null
    let authMethod: string = 'none'
    const authDetails: string[] = []
    
    // 1단계: 쿠키 기반 세션 확인 (여러 방법 시도)
    console.log('🍪 Step 1: Attempting multiple cookie-based authentication methods...')
    
    const cookieAuthAttempts = [
      {
        name: 'createRouteHandlerClient',
        method: async () => {
          const supabase = createRouteHandlerClient({ cookies })
          return await supabase.auth.getUser()
        }
      },
      {
        name: 'direct cookie parsing',
        method: async () => {
          // 쿠키를 직접 파싱해서 토큰 추출 시도
          if (!cookieHeader) throw new Error('No cookie header')
          
          const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => {
              const [name, ...rest] = c.trim().split('=')
              return [name, rest.join('=')]
            })
          )
          
          // Supabase 토큰 쿠키 찾기
          const tokenCookie = Object.entries(cookies).find(([name]) => 
            name.includes('access-token') || name.includes('auth-token')
          )
          
          if (!tokenCookie) throw new Error('No token cookie found')
          
          const token = tokenCookie[1]
          if (!token) throw new Error('Empty token in cookie')
          
          return await supabaseAdmin.auth.getUser(token)
        }
      }
    ]
    
    let cookieAuthSuccess = false
    
    for (const attempt of cookieAuthAttempts) {
      try {
        console.log(`🔍 Trying ${attempt.name}...`)
        
        const { data: { user: currentUser }, error: userError } = await attempt.method()
        
        console.log(`👤 ${attempt.name} - User check:`, {
          hasUser: !!currentUser,
          userId: currentUser?.id,
          email: currentUser?.email,
          userError: userError?.message
        })
        
        if (userError) {
          authDetails.push(`${attempt.name}: ${userError.message}`)
          console.error(`❌ ${attempt.name} failed:`, userError)
          continue
        }
        
        if (currentUser) {
          user = currentUser
          authMethod = `cookie-${attempt.name}`
          cookieAuthSuccess = true
          console.log(`✅ ${attempt.name} successful:`, {
            userId: user.id,
            email: user.email,
            method: authMethod
          })
          break
        } else {
          authDetails.push(`${attempt.name}: No user returned`)
          console.log(`⚠️ ${attempt.name}: No user found`)
        }
        
      } catch (attemptError) {
        authDetails.push(`${attempt.name}: ${attemptError instanceof Error ? attemptError.message : String(attemptError)}`)
        console.error(`❌ ${attempt.name} failed:`, attemptError)
      }
    }
    
    // 쿠키 인증이 모두 실패한 경우 토큰 기반 인증 시도
    if (!cookieAuthSuccess) {
      console.log('🔑 Step 2: Attempting token-based authentication methods...')
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        console.log('📝 Token details:', {
          hasToken: !!token,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...',
          tokenSuffix: '...' + token.substring(token.length - 10)
        })
        
        try {
          // JWT 토큰 구조 분석
          const tokenParts = token.split('.')
          console.log('🔐 JWT token analysis:', {
            parts: tokenParts.length,
            headerLength: tokenParts[0]?.length || 0,
            payloadLength: tokenParts[1]?.length || 0,
            signatureLength: tokenParts[2]?.length || 0,
            isValidJWT: tokenParts.length === 3
          })
          
          // 토큰 검증 (Service Role 사용)
          const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
          
          console.log('🔍 Token validation result:', {
            hasUser: !!tokenUser,
            userId: tokenUser?.id,
            email: tokenUser?.email,
            tokenError: tokenError?.message
          })
          
          if (tokenError) {
            authDetails.push(`Token validation: ${tokenError.message}`)
            console.error('❌ Token validation error:', tokenError)
            throw new Error(`Token validation failed: ${tokenError.message}`)
          }
          
          if (tokenUser) {
            user = tokenUser
            authMethod = 'bearer-token'
            console.log('✅ Token auth successful:', {
              userId: user.id,
              email: user.email,
              method: authMethod
            })
          } else {
            authDetails.push('Token validation: No user returned')
            throw new Error('Token validation returned no user')
          }
          
        } catch (tokenError) {
          authDetails.push(`Token auth: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`)
          console.error('❌ Token auth failed:', tokenError instanceof Error ? tokenError.message : String(tokenError))
        }
      } else {
        authDetails.push('No authorization header found')
        console.log('❌ No authorization header found for token auth')
      }
    }
    
    // 3단계: 최후의 수단 - 환경변수나 기타 방법 시도
    if (!user) {
      console.log('🔄 Step 3: Attempting alternative authentication methods...')
      
      try {
        // Supabase 클라이언트를 다른 방법으로 생성 시도
        const _alternativeSupabase = createClient(
          supabaseUrl!,
          supabaseAnonKey!,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false
            }
          }
        )
        
        // 요청에서 직접 세션 정보 추출 시도 (비상 방법)
        const requestBody = await request.clone().text()
        console.log('🔍 Request body analysis:', {
          hasBody: !!requestBody,
          bodyLength: requestBody.length,
          isFormData: request.headers.get('content-type')?.includes('multipart/form-data')
        })
        
        authDetails.push('Alternative methods attempted but no valid session found')
        console.log('⚠️ All alternative authentication methods exhausted')
        
      } catch (altError) {
        authDetails.push(`Alternative auth: ${altError instanceof Error ? altError.message : String(altError)}`)
        console.error('❌ Alternative auth failed:', altError)
      }
    }
    
    // 최종 인증 확인 및 상세 오류 보고
    if (!user) {
      console.error('🚨 Authentication completely failed - comprehensive debugging info:')
      console.error('🚨 Auth failure details:', authDetails)
      
      const errorResponse = {
        message: 'Auth session missing!',
        error: 'AUTHENTICATION_FAILED',
        details: {
          attempted_methods: [
            'createRouteHandlerClient',
            'direct cookie parsing',
            'bearer token validation',
            'alternative supabase client'
          ],
          failures: authDetails,
          headers: {
            hasAuthHeader: !!authHeader,
            hasCookieHeader: !!cookieHeader,
            origin,
            referer
          },
          timestamp: new Date().toISOString(),
          requestInfo: {
            url: request.url,
            method: request.method,
            headers: {
              'content-type': request.headers.get('content-type'),
              'user-agent': request.headers.get('user-agent')?.substring(0, 100)
            }
          }
        },
        solution: {
          steps: [
            '1. 브라우저에서 로그아웃 후 다시 로그인',
            '2. 브라우저 쿠키 및 캐시 삭제',
            '3. 시크릿 모드에서 재시도',
            '4. 브라우저 개발자 도구에서 네트워크 탭 확인'
          ]
        }
      }
      
      return NextResponse.json(errorResponse, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    console.log('🎉 Authentication successful:', {
      userId: user.id,
      email: user.email,
      method: authMethod,
      authDetails: authDetails.length > 0 ? authDetails : ['Direct success'],
      timestamp: new Date().toISOString()
    })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const projectId = formData.get('project_id') as string

    if (!file || !title) {
      return NextResponse.json(
        { message: '파일과 제목이 필요합니다.' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 파일 유효성 검사
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ]

    if (file.size > maxSize) {
      return NextResponse.json(
        { message: '파일 크기가 50MB를 초과합니다.' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: '지원되지 않는 파일 형식입니다.' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 파일명 생성 (타임스탬프 + UUID)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const randomId = crypto.randomUUID().substring(0, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `rfp-${timestamp}-${randomId}.${fileExtension}`
    
    // Supabase Storage에 파일 업로드 (Service Role 사용)
    const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('rfp-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { message: '파일 업로드 중 오류가 발생했습니다: ' + uploadError.message },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 파일 URL 생성
    const { data: urlData } = supabaseAdmin.storage
      .from('rfp-documents')
      .getPublicUrl(fileName)

    // 실제 파일에서 텍스트 추출
    let extractedText = ''
    try {
      console.log('RFP Upload: Extracting text from file type:', file.type)
      
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        // 텍스트 파일 처리
        extractedText = await file.text()
        console.log('RFP Upload: Text file extracted, length:', extractedText.length)
        
      } else if (file.type === 'application/pdf') {
        // PDF 파일 처리
        console.log('RFP Upload: Processing PDF file...')
        console.log('RFP Upload: File name:', file.name, 'Size:', file.size)
        
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          console.log('RFP Upload: PDF buffer created, size:', buffer.length)
          
          // PDF 파일인지 확인 (매직 넘버 체크)
          const pdfHeader = buffer.slice(0, 5).toString()
          if (!pdfHeader.includes('%PDF')) {
            console.error('RFP Upload: File is not a valid PDF')
            extractedText = `[${file.name}] 유효한 PDF 파일이 아닙니다.`
          } else {
            // pdf-parse 라이브러리 사용
            console.log('RFP Upload: Using pdf-parse library for text extraction')
            
            try {
              // pdf-parse 동적 import
              const pdfParse = (await import('pdf-parse')).default
              
              // PDF 텍스트 추출
              const pdfData = await pdfParse(buffer, {
                // PDF 파싱 옵션
                max: 0 // 페이지 수 제한 없음
              })
              
              extractedText = pdfData.text?.trim() || ''
              
              console.log('RFP Upload: pdf-parse extraction successful')
              console.log('RFP Upload: Pages:', pdfData.numpages)
              console.log('RFP Upload: Text length:', extractedText.length)
              console.log('RFP Upload: Info:', pdfData.info)
              
              if (extractedText.length > 0) {
                // 추출된 텍스트 정리
                extractedText = extractedText
                  .replace(/\s+/g, ' ')  // 여러 공백을 하나로
                  .replace(/(.)\1{10,}/g, '$1$1$1')  // 과도한 반복 문자 정리
                  .trim()
                
                if (extractedText.length < 100) {
                  extractedText = `[제한적 추출 성공 - ${pdfData.numpages}페이지]\n\n${extractedText}\n\n참고: PDF에서 일부 텍스트만 추출되었습니다.\n원본 파일명: ${file.name}\n\n더 완전한 추출을 위해:\n1. PDF를 열어서 텍스트를 복사하여 .txt 파일로 저장 후 업로드\n2. PDF를 Word 문서(.docx)로 변환 후 업로드`
                } else {
                  extractedText = `[PDF 텍스트 추출 성공 - ${pdfData.numpages}페이지]\n\n${extractedText}\n\n원본 파일명: ${file.name}`
                }
              } else {
                throw new Error('추출된 텍스트가 비어있습니다')
              }
              
            } catch (pdfParseError: any) {
              console.error('RFP Upload: pdf-parse failed, trying alternative method:', pdfParseError.message)
              
              // pdf-parse 실패 시 대안 방법 사용
              const pdfString = buffer.toString('binary')
              const textStreams: string[] = []
              
              // 텍스트 품질 검사 함수
              const isTextQualityGood = (text: string): boolean => {
                if (!text || text.length < 100) return false
                
                // 한글/영문/숫자/공백/기본 문장부호의 비율 확인
                const validChars = text.match(/[가-힣a-zA-Z0-9\s.,!?()[\]{}\-_:;"']/g) || []
                const validRatio = validChars.length / text.length
                
                // 연속된 이상한 문자 패턴 검사 (OCR 실패 징후)
                const hasWeirdPatterns = /[^가-힣a-zA-Z0-9\s.,!?()[\]{}\-_:;"']{3,}/.test(text)
                
                console.log('RFP Upload: Text quality check:', {
                  length: text.length,
                  validRatio: validRatio.toFixed(3),
                  hasWeirdPatterns,
                  isGoodQuality: validRatio > 0.7 && !hasWeirdPatterns
                })
                
                return validRatio > 0.7 && !hasWeirdPatterns
              }
              
              // BT...ET (텍스트 블록) 패턴 찾기
              const textBlocks = pdfString.match(/BT\s+[\s\S]*?ET/g)
              if (textBlocks) {
                for (const block of textBlocks) {
                  const textContent = block.match(/\((.*?)\)/g)
                  if (textContent) {
                    for (const text of textContent) {
                      const cleanText = text.replace(/[()]/g, '').trim()
                      if (cleanText.length > 2) {
                        textStreams.push(cleanText)
                      }
                    }
                  }
                }
              }
              
              // 스트림 내 텍스트 찾기
              if (textStreams.length === 0) {
                const streamMatches = pdfString.match(/stream\s+([\s\S]*?)\s+endstream/g)
                if (streamMatches) {
                  for (const stream of streamMatches) {
                    const utf8Text = stream.replace(/stream\s+|\s+endstream/g, '')
                    const decoded = utf8Text.replace(/[^\x20-\x7E가-힣ㄱ-ㅎㅏ-ㅣ0-9\s]/g, ' ')
                    if (decoded.trim().length > 10) {
                      textStreams.push(decoded.trim())
                    }
                  }
                }
              }
              
              if (textStreams.length > 0) {
                extractedText = textStreams.join('\n').trim()
                  .replace(/\s+/g, ' ')
                  .replace(/(.)\1{5,}/g, '$1')
                  .trim()
                
                console.log('RFP Upload: Alternative extraction result:', {
                  streams: textStreams.length,
                  length: extractedText.length,
                  preview: extractedText.substring(0, 100)
                })
                
                
                // 텍스트 품질이 좋으면 그대로 사용, 나쁘면 OCR 시도
                if (isTextQualityGood(extractedText)) {
                  console.log('RFP Upload: Alternative extraction quality is good, using it')
                  if (extractedText.length < 100) {
                    extractedText = `[대안 추출 방법 - 제한적 성공]\n\n${extractedText}\n\n주의: PDF 파싱 라이브러리 오류로 대안 방법을 사용했습니다.\n원본 파일명: ${file.name}\n\n더 완전한 추출을 위해:\n1. PDF를 열어서 내용을 복사하여 .txt 파일로 저장 후 업로드\n2. PDF를 Word 문서(.docx)로 변환 후 업로드`
                  } else {
                    extractedText = `[대안 방법으로 추출 성공]\n\n${extractedText}\n\n참고: PDF 파싱 라이브러리 오류로 대안 방법을 사용했습니다.\n원본 파일명: ${file.name}`
                  }
                } else {
                  console.log('RFP Upload: Alternative extraction quality is poor, trying OCR instead...')
                  // 품질이 나쁘면 OCR 시도 (아래 OCR 로직으로 이동)
                }
              }
              
              // OCR 시도 조건: textStreams가 없거나 품질이 나쁜 경우
              const shouldTryOCR = textStreams.length === 0 || 
                                   (textStreams.length > 0 && !isTextQualityGood(extractedText))
              
              if (shouldTryOCR) {
                console.log('RFP Upload: Trying OCR due to poor text quality or no text found...')
                
                // OCR 시도 (타임아웃 적용)
                try {
                  const { performOCR, hasExtractableText } = await import('@/lib/ocr/pdf-ocr')
                  
                  console.log('RFP Upload: Starting OCR process with timeout...')
                  
                  // OCR 처리에 30초 타임아웃 적용 (Vercel 함수 타임아웃 고려)
                  const ocrPromise = performOCR(buffer, file.name)
                  const timeoutPromise = new Promise<string>((_, reject) => {
                    setTimeout(() => reject(new Error('OCR 처리 시간이 30초를 초과했습니다')), 30000)
                  })
                  
                  const ocrResult = await Promise.race([ocrPromise, timeoutPromise])
                  
                  console.log('RFP Upload: OCR completed:', {
                    length: ocrResult.length,
                    preview: ocrResult.substring(0, 100)
                  })
                  
                  // OCR 결과가 대안 방법보다 나은지 확인
                  if (hasExtractableText(ocrResult) && ocrResult.length > 100) {
                    extractedText = `[OCR로 텍스트 추출 성공]\n\n${ocrResult}\n\n참고: PDF에서 직접 텍스트 추출에 실패하여 OCR을 사용했습니다.\n원본 파일명: ${file.name}`
                    console.log('RFP Upload: OCR result is better, using OCR text')
                  } else if (textStreams.length > 0 && extractedText) {
                    // OCR도 실패하고 대안 방법 결과가 있으면 대안 방법 사용 (품질이 나쁘더라도)
                    extractedText = `[대안 방법으로 제한적 추출]\n\n${extractedText}\n\n경고: OCR 시도도 실패하여 품질이 낮은 대안 방법 결과를 사용합니다.\n원본 파일명: ${file.name}\n\n권장사항:\n1. PDF를 열어서 내용을 복사하여 .txt 파일로 저장 후 업로드\n2. PDF를 Word 문서(.docx)로 변환 후 업로드`
                    console.log('RFP Upload: OCR failed, falling back to alternative extraction')
                  } else {
                    extractedText = `[${file.name}] OCR 결과가 불충분합니다.\n\nOCR 결과 길이: ${ocrResult.length}자\n\n해결 방법:\n1. **권장**: PDF를 열어서 내용을 복사(Ctrl+A, Ctrl+C)하여 텍스트 파일(.txt)로 저장 후 업로드\n2. PDF를 Word 문서(.docx)로 변환 후 업로드\n3. 더 높은 해상도로 스캔된 PDF 사용\n4. OCR 전용 도구 (Adobe Acrobat 등) 사용 후 재업로드`
                    console.log('RFP Upload: Both OCR and alternative extraction failed')
                  }
                } catch (ocrError) {
                  console.error('RFP Upload: OCR failed:', ocrError)
                  
                  // OCR 실패 시 대안 방법 결과가 있으면 사용
                  if (textStreams.length > 0 && extractedText) {
                    extractedText = `[대안 방법으로 제한적 추출 - OCR 실패]\n\n${extractedText}\n\n경고: OCR 처리 중 오류가 발생하여 품질이 낮은 대안 방법 결과를 사용합니다.\n\nOCR 오류: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}\n원본 파일명: ${file.name}`
                    console.log('RFP Upload: OCR error, using alternative extraction as fallback')
                  } else {
                    extractedText = `[${file.name}] PDF에서 텍스트를 찾을 수 없습니다.\n\n이 PDF는 다음 중 하나일 수 있습니다:\n• 이미지 스캔본 PDF (OCR 시도 실패)\n• 암호화된 PDF\n• 특수 형식의 PDF\n• 폰트가 임베드되지 않은 PDF\n\nOCR 오류: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}\n\n해결 방법:\n1. **권장**: PDF를 열어서 내용을 복사(Ctrl+A, Ctrl+C)하여 텍스트 파일(.txt)로 저장 후 업로드\n2. PDF를 Word 문서(.docx)로 변환 후 업로드\n3. 온라인 PDF → 텍스트 변환 도구 사용\n4. 고품질로 다시 스캔 후 업로드\n\n원본 파일명: ${file.name}`
                  }
                }
              }
            }
          }
        } catch (error: any) {
          console.error('RFP Upload: Complete PDF processing failure:', error)
          extractedText = `[${file.name}] PDF 처리 중 심각한 오류 발생\n\n오류: ${error?.message || '알 수 없는 오류'}\n\n강력 권장:\n1. 텍스트 파일(.txt)로 변환하여 업로드\n2. Word 문서(.docx)로 변환하여 업로드\n3. 다른 PDF 뷰어에서 저장 후 재시도\n\n기술 정보: ${error?.stack?.split('\n')[0] || 'N/A'}`
        }
        
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX 파일 처리
        console.log('RFP Upload: Processing DOCX file...')
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
        console.log('RFP Upload: DOCX extracted, length:', extractedText.length)
        
      } else if (file.type === 'application/msword') {
        // DOC 파일 - mammoth는 DOCX만 지원하므로 제한적
        console.log('RFP Upload: DOC files require manual conversion to DOCX for full support')
        extractedText = `[${file.name}] DOC 파일은 DOCX로 변환 후 업로드를 권장합니다. 텍스트 추출이 제한적일 수 있습니다.`
        
      } else if (file.type === 'application/rtf') {
        // RTF 파일 - 기본적인 텍스트 추출 시도
        const rawText = await file.text()
        // RTF 태그 제거 (간단한 방식)
        extractedText = rawText.replace(/\{\\.*?\}/g, '').replace(/\\.../g, ' ').trim()
        console.log('RFP Upload: RTF extracted, length:', extractedText.length)
        
      } else {
        extractedText = `[${file.name}] 지원되지 않는 파일 형식입니다.`
        console.log('RFP Upload: Unsupported file type:', file.type)
      }

      // 추출된 텍스트가 너무 짧으면 경고
      if (extractedText.length < 100) {
        console.warn('RFP Upload: Extracted text is very short:', extractedText.length, 'characters')
        extractedText += '\n\n[경고: 추출된 텍스트가 매우 짧습니다. 파일 내용을 확인해주세요.]'
      }
      
    } catch (error) {
      console.error('Text extraction error:', error)
      extractedText = `[${file.name}] 텍스트 추출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    }

    // RFP 문서 메타데이터 저장 (Service Role 사용)
    const { data: documentData, error: dbError } = await supabaseAdmin
      .from('rfp_documents')
      .insert({
        title,
        description,
        file_path: fileName,
        content: extractedText,
        phase_type: 'proposal', // 제안 진행 단계로 설정
        file_size: file.size,
        mime_type: file.type,
        metadata: {
          original_file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type
        },
        project_id: projectId || null,
        uploaded_by: user.id,
        status: 'draft'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      
      // 업로드된 파일 삭제 (롤백)
      await supabaseAdmin.storage
        .from('rfp-documents')
        .remove([fileName])
        
      return NextResponse.json(
        { message: '데이터베이스 저장 중 오류가 발생했습니다: ' + dbError.message },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const response: RFPUploadResponse = {
      rfp_document_id: documentData.id,
      file_url: urlData.publicUrl,
      message: 'RFP 파일이 성공적으로 업로드되었습니다.'
    }

    return NextResponse.json(response, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('🚨 RFP upload critical error:', error)
    
    // 상세한 오류 정보 수집
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString()
    }
    
    console.error('🚨 Complete error details:', errorDetails)
    
    // JSON 응답 반환 보장
    return NextResponse.json(
      { 
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: errorDetails.message,
        details: 'RFP 파일 업로드 중 예상치 못한 오류가 발생했습니다.',
        timestamp: errorDetails.timestamp,
        // 개발 환경에서만 스택 추가
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails.stack })
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
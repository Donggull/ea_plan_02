'use client'

import React, { useState, useRef, useCallback } from 'react'
import Button from '@/basic/src/components/Button/Button'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
  disabled?: boolean
  model?: string
  placeholder?: string
  className?: string
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  model = 'claude',
  placeholder = '메시지를 입력하세요...',
  className
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // 텍스트 영역 높이 자동 조정
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 120) // 최대 5줄
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  // 메시지 내용 변경 핸들러
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    adjustTextareaHeight()
  }

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return
    if (disabled || isLoading) return

    setIsLoading(true)
    
    try {
      await onSendMessage(message.trim(), attachments)
      setMessage('')
      setAttachments([])
      
      // 텍스트 영역 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 파일 첨부
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}이 너무 큽니다. 10MB 이하의 파일을 선택해주세요.`)
        return false
      }
      return true
    })
    
    setAttachments(prev => [...prev, ...validFiles])
    
    // 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 첨부 파일 제거
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // 음성 녹음 시작/중지
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      // 녹음 중지
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
    } else {
      // 녹음 시작
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        
        const audioChunks: BlobPart[] = []
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
          const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, {
            type: 'audio/wav'
          })
          setAttachments(prev => [...prev, audioFile])
          
          // 스트림 정리
          stream.getTracks().forEach(track => track.stop())
        }
        
        mediaRecorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error('음성 녹음 실패:', error)
        alert('마이크 접근 권한이 필요합니다.')
      }
    }
  }

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('bg-white border-t border-gray-200', className)}>
      {/* 첨부 파일 미리보기 */}
      {attachments.length > 0 && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
              >
                <IconRenderer 
                  icon={file.type.startsWith('image/') ? 'Image' : 'File'} 
                  size={16}
                  className="text-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blue-900 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-blue-600">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-blue-400 hover:text-red-600 transition-colors"
                >
                  <IconRenderer icon="X" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-4">
        <div className="flex items-end space-x-3">
          {/* 첨부 파일 버튼 */}
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="파일 첨부"
            >
              <IconRenderer icon="Paperclip" size={18} />
            </Button>
            
            {/* 음성 녹음 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoiceRecording}
              disabled={disabled}
              className={cn(
                'p-2 text-gray-500 hover:text-gray-700',
                isRecording && 'text-red-500 bg-red-50'
              )}
              title={isRecording ? '녹음 중지' : '음성 녹음'}
            >
              <IconRenderer 
                icon={isRecording ? 'Square' : 'Mic'} 
                size={18}
              />
            </Button>
          </div>

          {/* 텍스트 입력 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12',
                'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'placeholder:text-gray-400',
                disabled && 'bg-gray-50 cursor-not-allowed'
              )}
              style={{ minHeight: '44px' }}
              rows={1}
            />
            
            {/* 모델 표시 */}
            {model && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1">
                {model}
              </div>
            )}
          </div>

          {/* 전송 버튼 */}
          <Button
            onClick={handleSendMessage}
            disabled={disabled || isLoading || (!message.trim() && attachments.length === 0)}
            className={cn(
              'px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center min-w-[44px]'
            )}
            title="메시지 전송 (Enter)"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <IconRenderer icon="Send" size={18} />
            )}
          </Button>
        </div>

        {/* 힌트 텍스트 */}
        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
          <div>
            {isRecording && (
              <span className="text-red-500 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />
                녹음 중...
              </span>
            )}
          </div>
          <div>
            Enter로 전송, Shift+Enter로 줄바꿈
          </div>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
      />
    </div>
  )
}
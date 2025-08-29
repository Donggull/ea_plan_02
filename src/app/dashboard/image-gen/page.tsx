'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Image, Download, Wand2 } from 'lucide-react'

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('flux-schnell')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    
    setTimeout(() => {
      setIsGenerating(false)
    }, 3000)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">이미지 생성</h1>
          <p className="text-muted-foreground">
            AI를 활용해 고품질 이미지와 그래픽을 생성하세요
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                이미지 생성
              </CardTitle>
              <CardDescription>
                원하는 이미지를 설명해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">프롬프트</Label>
                <Textarea
                  id="prompt"
                  placeholder="생성하고 싶은 이미지를 자세히 설명해주세요..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">AI 모델</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flux-schnell">Flux Schnell</SelectItem>
                    <SelectItem value="imagen-3">Imagen 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? '생성 중...' : '이미지 생성'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>생성된 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    이미지가 여기에 표시됩니다
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" disabled>
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 생성 이미지</CardTitle>
          <CardDescription>
            최근에 생성한 이미지들을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Image className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <h3 className="text-lg font-medium">생성된 이미지가 없습니다</h3>
              <p className="text-muted-foreground mt-2">
                첫 번째 이미지를 생성해보세요
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Search, UserCog, TrendingUp, Shield, Crown } from 'lucide-react'

// 등급 정보 상수
const USER_TIERS = {
  0: { name: 'GUEST', limit: 10, color: 'bg-gray-500' },
  1: { name: 'STARTER', limit: 50, color: 'bg-blue-500' },
  2: { name: 'BASIC', limit: 100, color: 'bg-green-500' },
  3: { name: 'STANDARD', limit: 300, color: 'bg-yellow-500' },
  4: { name: 'PROFESSIONAL', limit: 500, color: 'bg-orange-500' },
  5: { name: 'BUSINESS', limit: 1000, color: 'bg-red-500' },
  6: { name: 'ENTERPRISE', limit: 2000, color: 'bg-purple-500' },
  7: { name: 'PREMIUM', limit: 5000, color: 'bg-pink-500' },
  8: { name: 'VIP', limit: 10000, color: 'bg-indigo-500' },
  9: { name: 'ADMIN', limit: -1, color: 'bg-black' }
}

interface User {
  id: string
  name: string
  email: string
  user_tier: number
  daily_api_limit: number
  daily_api_used: number
  api_reset_date: string
  is_active: boolean
  created_at: string
  tier_upgraded_at: string
}

export function UserTierManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newTier, setNewTier] = useState<string>('')
  const [changeReason, setChangeReason] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const supabase = createClientComponentClient()

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, user_tier, daily_api_limit, daily_api_used, api_reset_date, is_active, created_at, tier_upgraded_at')
        .order('user_tier', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('사용자 목록 가져오기 실패:', error)
      toast.error('사용자 목록을 가져오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 등급 변경
  const changeTier = async () => {
    if (!selectedUser || !newTier || !changeReason.trim()) {
      toast.error('모든 필드를 입력해주세요.')
      return
    }

    try {
      const tierNum = parseInt(newTier)
      const newLimit = USER_TIERS[tierNum as keyof typeof USER_TIERS]?.limit || 10

      // users 테이블 업데이트
      const { error: userError } = await supabase
        .from('users')
        .update({
          user_tier: tierNum,
          daily_api_limit: newLimit === -1 ? -1 : newLimit,
          tier_upgraded_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)

      if (userError) throw userError

      // 이력 기록
      const { error: historyError } = await supabase
        .from('user_tier_history')
        .insert({
          user_id: selectedUser.id,
          old_tier: selectedUser.user_tier,
          new_tier: tierNum,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          change_reason: changeReason
        })

      if (historyError) throw historyError

      toast.success('사용자 등급이 성공적으로 변경되었습니다.')
      setDialogOpen(false)
      setNewTier('')
      setChangeReason('')
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('등급 변경 실패:', error)
      toast.error('등급 변경에 실패했습니다.')
    }
  }

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = filterTier === 'all' || user.user_tier.toString() === filterTier
    return matchesSearch && matchesTier
  })

  // 통계 계산
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.is_active).length
  const totalApiUsage = users.reduce((sum, u) => sum + (u.daily_api_used || 0), 0)
  const avgTier = users.length > 0 ? users.reduce((sum, u) => sum + u.user_tier, 0) / users.length : 0

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">활성 사용자: {activeUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 API 사용량</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApiUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">총 호출 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 등급</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTier.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {USER_TIERS[Math.round(avgTier) as keyof typeof USER_TIERS]?.name || 'GUEST'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">관리자</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.user_tier === 9).length}
            </div>
            <p className="text-xs text-muted-foreground">최고 권한</p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 관리</CardTitle>
          <CardDescription>사용자 등급을 관리하고 API 사용량을 모니터링합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="사용자명 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="등급 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 등급</SelectItem>
                {Object.entries(USER_TIERS).map(([tier, info]) => (
                  <SelectItem key={tier} value={tier}>
                    {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 사용자 테이블 */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead>API 사용량</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${USER_TIERS[user.user_tier as keyof typeof USER_TIERS]?.color} text-white`}>
                        {USER_TIERS[user.user_tier as keyof typeof USER_TIERS]?.name || 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.daily_api_used || 0} / {user.daily_api_limit === -1 ? '무제한' : user.daily_api_limit}</div>
                        <div className="text-muted-foreground">
                          {user.daily_api_limit === -1 ? '무제한' : `${((user.daily_api_used || 0) / user.daily_api_limit * 100).toFixed(1)}%`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setNewTier(user.user_tier.toString())
                            }}
                          >
                            등급 변경
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 등급 변경 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 등급 변경</DialogTitle>
            <DialogDescription>
              {selectedUser && `${selectedUser.name} (${selectedUser.email})의 등급을 변경합니다.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tier" className="text-right">
                새 등급
              </Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="등급 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(USER_TIERS).map(([tier, info]) => (
                    <SelectItem key={tier} value={tier}>
                      {info.name} (API: {info.limit === -1 ? '무제한' : `${info.limit}/일`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                변경 사유
              </Label>
              <Textarea
                id="reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="등급 변경 사유를 입력하세요..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={changeTier} disabled={!newTier || !changeReason.trim()}>
              등급 변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
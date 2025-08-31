'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import Badge from '@/basic/src/components/Badge/Badge';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles
} from 'lucide-react';
import { MarketResearchQuestionGenerator } from '@/lib/market-research/question-generator';
import type {
  MarketResearch,
  PersonaGenerationGuidance,
} from '@/types/market-research';
import type { AnalysisQuestion, QuestionResponse } from '@/types/market-research';

interface MarketResearchQuestionnaireProps {
  marketData: MarketResearch;
  onComplete: (guidance: PersonaGenerationGuidance) => void;
  onSkip?: () => void;
}

export default function MarketResearchQuestionnaire({
  marketData,
  onComplete,
  onSkip
}: MarketResearchQuestionnaireProps) {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    generateQuestionsFromMarketData();
  }, [marketData]);

  const generateQuestionsFromMarketData = async () => {
    try {
      setLoading(true);
      const generator = new MarketResearchQuestionGenerator();
      const generatedQuestions = await generator.generatePersonaResearchQuestions(
        marketData,
        []
      );
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (value: any) => {
    setCurrentResponse(value);
  };

  const handleNext = () => {
    if (currentResponse !== null && currentResponse !== undefined) {
      const currentQuestion = questions[currentQuestionIndex];
      const response: QuestionResponse = {
        question_id: currentQuestion.id,
        response_value: currentResponse,
        response_text: typeof currentResponse === 'string' ? currentResponse : JSON.stringify(currentResponse)
      };

      setResponses([...responses.filter(r => r.question_id !== currentQuestion.id), response]);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentResponse(null);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const previousResponse = responses.find(
        r => r.question_id === questions[currentQuestionIndex - 1].id
      );
      setCurrentResponse(previousResponse?.response_value || null);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      if (currentResponse !== null) {
        handleNext();
      }

      const generator = new MarketResearchQuestionGenerator();
      
      const finalResponses = [...responses];
      if (currentResponse !== null && currentQuestionIndex === questions.length - 1) {
        finalResponses.push({
          question_id: questions[currentQuestionIndex].id,
          response_value: currentResponse,
          response_text: typeof currentResponse === 'string' ? currentResponse : JSON.stringify(currentResponse)
        });
      }

      await generator.saveQuestions(questions, marketData.id, marketData.rfp_analysis_id || undefined);
      await generator.saveResponses(finalResponses, marketData.id);
      
      const guidance = await generator.generatePersonaGuidance(finalResponses, marketData);
      
      onComplete(guidance);
    } catch (error) {
      console.error('Error submitting responses:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: AnalysisQuestion) => {
    switch (question.question_type) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="single-choice"
                  value={option}
                  checked={currentResponse === option}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`checkbox-${index}`}
                  checked={(currentResponse as string[] || []).includes(option)}
                  onChange={(e) => {
                    const current = (currentResponse as string[]) || [];
                    if (e.target.checked) {
                      handleResponseChange([...current, option]);
                    } else {
                      handleResponseChange(current.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`checkbox-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'text_short':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentResponse || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="답변을 입력하세요"
          />
        );

      case 'text_long':
        return (
          <textarea
            className="w-full min-h-[120px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentResponse || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="상세한 답변을 입력하세요"
          />
        );

      case 'rating':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>낮음</span>
              <span>보통</span>
              <span>높음</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={currentResponse || 3}
              onChange={(e) => handleResponseChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center">
              <span className="text-2xl font-semibold">{currentResponse || 3}</span>
              <span className="text-gray-600"> / 5</span>
            </div>
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="yes"
                name="yes-no"
                value="yes"
                checked={currentResponse === 'yes'}
                onChange={(e) => handleResponseChange(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="yes" className="cursor-pointer">예</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="no"
                name="yes-no"
                value="no"
                checked={currentResponse === 'no'}
                onChange={(e) => handleResponseChange(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="no" className="cursor-pointer">아니오</label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200">
        <div className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
            <p className="text-gray-600">질문을 생성하고 있습니다...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="bg-white border border-gray-200">
        <div className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">생성된 질문이 없습니다</p>
            {onSkip && (
              <Button onClick={onSkip} variant="outline" className="mt-4">
                건너뛰기
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="space-y-6">
      {/* 진행 상황 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">페르소나 분석 준비</h3>
            <p className="text-sm text-gray-600">
              시장 조사 결과를 바탕으로 페르소나 개발 방향을 설정합니다
            </p>
          </div>
          <Badge variant="outline">
            {currentQuestionIndex + 1} / {questions.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* 현재 질문 */}
      <Card className="bg-white border border-gray-200">
        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-2">
            {currentQuestion.priority === 'high' && (
              <Badge variant="primary" className="mt-0.5">중요</Badge>
            )}
            {currentQuestion.priority === 'medium' && (
              <Badge variant="secondary" className="mt-0.5">보통</Badge>
            )}
            <h4 className="text-lg font-semibold flex-1">
              {currentQuestion.question_text}
            </h4>
          </div>
          {currentQuestion.context && (
            <div className="flex items-start gap-2 pt-2">
              <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{currentQuestion.context}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {renderQuestionInput(currentQuestion)}

          {currentQuestion.next_step_impact && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>다음 단계 영향:</strong> {currentQuestion.next_step_impact}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          이전
        </Button>

        <div className="flex gap-2">
          {onSkip && (
            <Button variant="outline" onClick={onSkip}>
              건너뛰기
            </Button>
          )}

          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              disabled={currentResponse === null || currentResponse === undefined}
              variant="primary"
            >
              다음
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || (currentResponse === null && responses.length < questions.length)}
              variant="primary"
            >
              {submitting ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  분석 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  완료
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 답변 요약 */}
      {responses.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <div className="mb-4">
            <h4 className="text-base font-semibold">답변 요약</h4>
          </div>
          <div className="space-y-2">
            {responses.map((response, index) => {
              const question = questions.find(q => q.id === response.question_id);
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">
                    {question?.question_text.substring(0, 50)}...
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
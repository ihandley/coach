import { describe, it, expect, vi } from 'vitest'
import OpenAI from 'openai'
import { classifyEmailLLM } from '../../../server/utils/classify-email-llm'

vi.mock('openai')

describe('classifyEmailLLM', () => {
  it('returns valid classification', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              status: 'rejected',
              confidence: 0.9,
            }),
          },
        },
      ],
    })

    ;(OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }))

    const result = await classifyEmailLLM({
      subject: 'Application Update',
      snippet: 'We regret to inform you...',
    })

    expect(result.status).toBe('rejected')
    expect(result.confidence).toBe(0.9)
  })

  it('throws on invalid JSON', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'not json',
          },
        },
      ],
    })

    ;(OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }))

    await expect(
      classifyEmailLLM({
        subject: 'Test',
        snippet: 'Test',
      })
    ).rejects.toThrow()
  })

  it('throws on invalid status', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              status: 'invalid',
              confidence: 0.9,
            }),
          },
        },
      ],
    })

    ;(OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }))

    await expect(
      classifyEmailLLM({
        subject: 'Test',
        snippet: 'Test',
      })
    ).rejects.toThrow()
  })
})

import type { Meta, StoryObj } from '@storybook/react'
import { Profile Card } from './Profile Card'

const meta: Meta<typeof Profile Card> = {
  title: 'Components/Profile Card',
  component: Profile Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Profile card component with avatar, cover image, and user information'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","compact","detailed"]
    },
    name: {
      control: { type: 'text' }
    },
    title: {
      control: { type: 'text' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    name: undefined,
    title: undefined
  }
}

export const Default: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Compact: Story = {
  args: {
    ...Default.args,
    variant: 'compact'
  }
}

export const Detailed: Story = {
  args: {
    ...Default.args,
    variant: 'detailed'
  }
}
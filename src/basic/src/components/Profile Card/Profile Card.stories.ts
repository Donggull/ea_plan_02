import type { Meta, StoryObj } from '@storybook/react'
import ProfileCard from './Profile Card'

const meta: Meta<typeof ProfileCard> = {
  title: 'Components/Profile Card',
  component: ProfileCard,
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

export const DefaultVariant: Story = {
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
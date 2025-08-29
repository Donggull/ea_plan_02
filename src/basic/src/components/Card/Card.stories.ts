import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Basic card container component'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","outlined","elevated"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default"
  }
}

export const Default: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Outlined: Story = {
  args: {
    ...Default.args,
    variant: 'outlined'
  }
}

export const Elevated: Story = {
  args: {
    ...Default.args,
    variant: 'elevated'
  }
}
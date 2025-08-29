import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Basic button component with variants'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["primary","secondary","outline","ghost"]
    },
    size: {
      control: { type: 'select' },
      options: ["sm","md","lg"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "primary",
    size: "md"
  }
}

export const Primary: Story = {
  args: {
    ...Default.args,
    variant: 'primary'
  }
}

export const Secondary: Story = {
  args: {
    ...Default.args,
    variant: 'secondary'
  }
}

export const Outline: Story = {
  args: {
    ...Default.args,
    variant: 'outline'
  }
}

export const Ghost: Story = {
  args: {
    ...Default.args,
    variant: 'ghost'
  }
}

export const Sm: Story = {
  args: {
    ...Default.args,
    size: 'sm'
  }
}

export const Md: Story = {
  args: {
    ...Default.args,
    size: 'md'
  }
}

export const Lg: Story = {
  args: {
    ...Default.args,
    size: 'lg'
  }
}
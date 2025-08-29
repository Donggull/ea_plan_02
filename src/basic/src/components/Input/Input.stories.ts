import type { Meta, StoryObj } from '@storybook/react'
import Input from './Input'

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Basic input field component'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","filled"]
    },
    inputSize: {
      control: { type: 'select' },
      options: ["sm","md","lg"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    inputSize: "md"
  }
}

export const DefaultVariant: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Filled: Story = {
  args: {
    ...Default.args,
    variant: 'filled'
  }
}

export const Sm: Story = {
  args: {
    ...Default.args,
    inputSize: 'sm'
  }
}

export const Md: Story = {
  args: {
    ...Default.args,
    inputSize: 'md'
  }
}

export const Lg: Story = {
  args: {
    ...Default.args,
    inputSize: 'lg'
  }
}
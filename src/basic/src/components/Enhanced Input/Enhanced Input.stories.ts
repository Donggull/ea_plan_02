import type { Meta, StoryObj } from '@storybook/react'
import EnhancedInput from './Enhanced Input'

const meta: Meta<typeof EnhancedInput> = {
  title: 'Components/Enhanced Input',
  component: EnhancedInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced input with icons, clear functionality, and improved accessibility'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","filled","flushed","outline"]
    },
    clearable: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    clearable: false
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

export const Flushed: Story = {
  args: {
    ...Default.args,
    variant: 'flushed'
  }
}

export const Outline: Story = {
  args: {
    ...Default.args,
    variant: 'outline'
  }
}
import type { Meta, StoryObj } from '@storybook/react'
import Toast from './Toast'

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toast notification for user feedback'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","success","warning","error"]
    },
    duration: {
      control: { type: 'number' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    duration: 5000
  }
}

export const DefaultVariant: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Success: Story = {
  args: {
    ...Default.args,
    variant: 'success'
  }
}

export const Warning: Story = {
  args: {
    ...Default.args,
    variant: 'warning'
  }
}

export const Error: Story = {
  args: {
    ...Default.args,
    variant: 'error'
  }
}
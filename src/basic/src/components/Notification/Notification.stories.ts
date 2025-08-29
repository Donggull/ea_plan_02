import type { Meta, StoryObj } from '@storybook/react'
import Notification from './Notification'

const meta: Meta<typeof Notification> = {
  title: 'Components/Notification',
  component: Notification,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Rich notification with actions and positioning'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["info","success","warning","error"]
    },
    position: {
      control: { type: 'select' },
      options: ["top-right","top-left","bottom-right","bottom-left"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "info",
    position: "top-right"
  }
}

export const Info: Story = {
  args: {
    ...Default.args,
    variant: 'info'
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

export const TopRight: Story = {
  args: {
    ...Default.args,
    position: 'top-right'
  }
}

export const TopLeft: Story = {
  args: {
    ...Default.args,
    position: 'top-left'
  }
}

export const BottomRight: Story = {
  args: {
    ...Default.args,
    position: 'bottom-right'
  }
}

export const BottomLeft: Story = {
  args: {
    ...Default.args,
    position: 'bottom-left'
  }
}
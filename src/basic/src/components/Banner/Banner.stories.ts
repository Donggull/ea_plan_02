import type { Meta, StoryObj } from '@storybook/react'
import Banner from './Banner'

const meta: Meta<typeof Banner> = {
  title: 'Components/Banner',
  component: Banner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Full-width banner for important announcements'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["info","success","warning","error"]
    },
    dismissible: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "info",
    dismissible: false
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
import type { Meta, StoryObj } from '@storybook/react'
import { Divider } from './Divider'

const meta: Meta<typeof Divider> = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Visual divider for content separation'
      }
    }
  },
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ["horizontal","vertical"]
    },
    variant: {
      control: { type: 'select' },
      options: ["solid","dashed","dotted"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    orientation: "horizontal",
    variant: "solid"
  }
}

export const Horizontal: Story = {
  args: {
    ...Default.args,
    orientation: 'horizontal'
  }
}

export const Vertical: Story = {
  args: {
    ...Default.args,
    orientation: 'vertical'
  }
}

export const Solid: Story = {
  args: {
    ...Default.args,
    variant: 'solid'
  }
}

export const Dashed: Story = {
  args: {
    ...Default.args,
    variant: 'dashed'
  }
}

export const Dotted: Story = {
  args: {
    ...Default.args,
    variant: 'dotted'
  }
}
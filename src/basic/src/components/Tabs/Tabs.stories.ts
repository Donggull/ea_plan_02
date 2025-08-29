import type { Meta, StoryObj } from '@storybook/react'
import { Tabs } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tabbed navigation component'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","pills","underline"]
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
    variant: "default",
    size: "md"
  }
}

export const Default: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Pills: Story = {
  args: {
    ...Default.args,
    variant: 'pills'
  }
}

export const Underline: Story = {
  args: {
    ...Default.args,
    variant: 'underline'
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
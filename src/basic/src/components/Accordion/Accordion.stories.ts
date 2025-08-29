import type { Meta, StoryObj } from '@storybook/react'
import Accordion from './Accordion'

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Collapsible content panels'
      }
    }
  },
  argTypes: {
    multiple: {
      control: { type: 'boolean' }
    },
    variant: {
      control: { type: 'select' },
      options: ["default","bordered","ghost"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    multiple: false,
    variant: "default"
  }
}

export const DefaultVariant: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Bordered: Story = {
  args: {
    ...Default.args,
    variant: 'bordered'
  }
}

export const Ghost: Story = {
  args: {
    ...Default.args,
    variant: 'ghost'
  }
}
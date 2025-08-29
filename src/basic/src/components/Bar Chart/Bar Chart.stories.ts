import type { Meta, StoryObj } from '@storybook/react'
import BarChart from './Bar Chart'

const meta: Meta<typeof BarChart> = {
  title: 'Components/BarChart',
  component: BarChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Customizable bar chart with multiple variants'
      }
    }
  },
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ["vertical","horizontal"]
    },
    variant: {
      control: { type: 'select' },
      options: ["default","rounded","gradient"]
    },
    showValues: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    orientation: "vertical",
    variant: "default",
    showValues: false
  }
}

export const Vertical: Story = {
  args: {
    ...Default.args,
    orientation: 'vertical'
  }
}

export const Horizontal: Story = {
  args: {
    ...Default.args,
    orientation: 'horizontal'
  }
}

export const DefaultVariant: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Rounded: Story = {
  args: {
    ...Default.args,
    variant: 'rounded'
  }
}

export const Gradient: Story = {
  args: {
    ...Default.args,
    variant: 'gradient'
  }
}
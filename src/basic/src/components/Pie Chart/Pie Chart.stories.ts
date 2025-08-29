import type { Meta, StoryObj } from '@storybook/react'
import { Pie Chart } from './Pie Chart'

const meta: Meta<typeof Pie Chart> = {
  title: 'Components/Pie Chart',
  component: Pie Chart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Pie/donut chart with legend and interactive segments'
      }
    }
  },
  argTypes: {
    innerRadius: {
      control: { type: 'number' }
    },
    showLegend: {
      control: { type: 'boolean' }
    },
    showLabels: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    innerRadius: 0,
    showLegend: true,
    showLabels: true
  }
}


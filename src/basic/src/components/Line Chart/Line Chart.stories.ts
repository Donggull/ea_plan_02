import type { Meta, StoryObj } from '@storybook/react'
import { Line Chart } from './Line Chart'

const meta: Meta<typeof Line Chart> = {
  title: 'Components/Line Chart',
  component: Line Chart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Line chart with smooth curves and interactive dots'
      }
    }
  },
  argTypes: {
    smooth: {
      control: { type: 'boolean' }
    },
    showDots: {
      control: { type: 'boolean' }
    },
    showGrid: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    smooth: false,
    showDots: true,
    showGrid: true
  }
}


import type { Meta, StoryObj } from '@storybook/react'
import Typography from './Typography'

const meta: Meta<typeof Typography> = {
  title: 'Components/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Typography component for text styling'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["h1","h2","h3","h4","body","small","code"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "body"
  }
}

export const H1: Story = {
  args: {
    ...Default.args,
    variant: 'h1'
  }
}

export const H2: Story = {
  args: {
    ...Default.args,
    variant: 'h2'
  }
}

export const H3: Story = {
  args: {
    ...Default.args,
    variant: 'h3'
  }
}

export const H4: Story = {
  args: {
    ...Default.args,
    variant: 'h4'
  }
}

export const Body: Story = {
  args: {
    ...Default.args,
    variant: 'body'
  }
}

export const Small: Story = {
  args: {
    ...Default.args,
    variant: 'small'
  }
}

export const Code: Story = {
  args: {
    ...Default.args,
    variant: 'code'
  }
}
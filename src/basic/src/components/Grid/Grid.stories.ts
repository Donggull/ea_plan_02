import type { Meta, StoryObj } from '@storybook/react'
import { Grid } from './Grid'

const meta: Meta<typeof Grid> = {
  title: 'Components/Grid',
  component: Grid,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Responsive grid layout system'
      }
    }
  },
  argTypes: {
    cols: {
      control: { type: 'select' },
      options: ["1","2","3","4","5","6","7","8","9","10","11","12"]
    },
    gap: {
      control: { type: 'select' },
      options: ["none","xs","sm","md","lg","xl"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    cols: 1,
    gap: "md"
  }
}

export const 1: Story = {
  args: {
    ...Default.args,
    cols: '1'
  }
}

export const 2: Story = {
  args: {
    ...Default.args,
    cols: '2'
  }
}

export const 3: Story = {
  args: {
    ...Default.args,
    cols: '3'
  }
}

export const 4: Story = {
  args: {
    ...Default.args,
    cols: '4'
  }
}

export const 5: Story = {
  args: {
    ...Default.args,
    cols: '5'
  }
}

export const 6: Story = {
  args: {
    ...Default.args,
    cols: '6'
  }
}

export const 7: Story = {
  args: {
    ...Default.args,
    cols: '7'
  }
}

export const 8: Story = {
  args: {
    ...Default.args,
    cols: '8'
  }
}

export const 9: Story = {
  args: {
    ...Default.args,
    cols: '9'
  }
}

export const 10: Story = {
  args: {
    ...Default.args,
    cols: '10'
  }
}

export const 11: Story = {
  args: {
    ...Default.args,
    cols: '11'
  }
}

export const 12: Story = {
  args: {
    ...Default.args,
    cols: '12'
  }
}

export const None: Story = {
  args: {
    ...Default.args,
    gap: 'none'
  }
}

export const Xs: Story = {
  args: {
    ...Default.args,
    gap: 'xs'
  }
}

export const Sm: Story = {
  args: {
    ...Default.args,
    gap: 'sm'
  }
}

export const Md: Story = {
  args: {
    ...Default.args,
    gap: 'md'
  }
}

export const Lg: Story = {
  args: {
    ...Default.args,
    gap: 'lg'
  }
}

export const Xl: Story = {
  args: {
    ...Default.args,
    gap: 'xl'
  }
}
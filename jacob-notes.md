# Jacob's Loom v2 Iteration Notes

## Components

### Button [ ]

- I am curious if buttons architecture should follow a different pattern: it currently uses variant to differentiate default, from secondary, from ghost, from outline, etc.... I feel we need to have variant: which is determining things like filled/outline/ghost as a prop, then we have a color prop which takes all general UI/brand colors, then sizing, leading/trailing icon, etc.
- An iconOnly button really is just a ghost icon with a leading or trailing icon enabled, right? Is there reason to simplify this?


### Badge [ ]

- Dots may be unnecessary, could likely use an icon/unicode character and follow a perscribed font size or icon size given the content of parent/sibling content, right?
- We lean so hard on our badges having soft edges, not necessary to show but we need to ensure a sight with harder edges can have a badge system that accomodates that visual pattern.
- I am unsure if outline-mono needs to be its own variant, as it could just be a neutral outline with subtle styling if we wanted it to.
- For interactive and on remove, I think those items should take the padding/shape of the button, and only round the edges (left, right) of their respective side -- causing for a more uniform, button-like hover effect throughout.

### FAB [ ]

- Extended should be allowed for small FABs as well.


### FabMenu [ ]

- Assuming in production this is a bottom positioned item with no way for viewport expansion, this will work well
    - Especially once animation added.
    - We will have to ensure we are using a label component or something we can easily style within the fab openings.

### Toggle [ ]

- Seems fine, same argument as we had for badge where the border radius needs to remain malleable with the rest of the site theme.

### Toggle Group [ ]

- Will need to add variant where we decide if we want the border to be the same color as the primary toggle background, or remain different to encapsulate the selection.
- Need to iterate over spaced variant -- need to see it.
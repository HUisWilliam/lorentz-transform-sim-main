# lorentz-transform-sim
lorentz transform visualization (simple)
The below content is also available in the html, reading it in the html is recommended.

How to Use the Diagram
This Lorentz Transformation Visualizer demonstrates several fundamental concepts of special relativity. The diagram shows a space-time grid that is transformed by varying the speed (β) parameter. Below you will find an explanation for each control and function.

General Controls
β Slider / Number Input: Adjust these controls to change the transformation parameter (β = v/c). This affects the Lorentz transformation used in all visualizations. All points on the diagram are transformed with the current value of β.
Zoom & Drag: You can drag the diagram by clicking and moving the mouse, and use the mouse wheel to zoom in/out.
Function Buttons and Their Effects
Enter (Add Velocity): Adds a new velocity line on the diagram. Each line represents a worldline corresponding to a chosen velocity (v). The code pushes each new velocity (if fewer than 6 exist) into an array and then the velocity line is Lorentz transformed using the current β value. Internally, the function loops over time and plots transformed endpoints.
Time Dilation: Prompts you to choose one of the added velocity lines. Upon selection, the diagram will highlight time dilation effects for that specific velocity. The related function uses the selected velocity to set β value and re-renders the diagram.
Length Contraction: Adds a pair of worldlines that simulate length contraction. Internally, the function computes two sets of points (for the head and tail) along fixed S‑frame positions. It then applies the Lorentz transform to these points using the current β, drawing both individual dots and connecting lines. The area between these lines is filled with a translucent color to emphasize the contraction effect.
Ladder and Barn Paradox: Visualizes the classic paradox where a ladder (inclined line) passes through a barn (vertical lines). The barn is drawn similarly to the cat worldlines (with fixed boundaries that get transformed), and the ladder is drawn by sampling points along two inclined lines. The ladder edges are computed using equations based on the S‑frame and are Lorentz transformed for the current β.
Twin Paradox: This button draws three distinct worldline segments representing the twin paradox scenario:
A vertical line for the stay-at-home twin.
An outbound leg given for the traveling twin.
A return leg given once the twin turns around.
Each segment is Lorentz transformed by the current β, so that changes to β update their orientation.
Hyperbola: When activated, this function draws one or more hyperbolas under the equation t² – x² = τ². These curves represent surfaces of constant proper time. The code loops over a range of proper-time values (τ) and for each, it computes (x, t) pairs, then transforms them using the current β before mapping to canvas coordinates.Each point on a hyperbola will move to another point on that same hyperbola when Lorentz transformed.
Clear: Resets the diagram by clearing all arrays and resetting all flags; this includes velocity lines, the cat, ladder/barn, twin paradox, and hyperbola visualizations.
Save Diagram: Saves the current view of the canvas as a PNG image.
Enjoy experimenting with different values and scenarios!!!

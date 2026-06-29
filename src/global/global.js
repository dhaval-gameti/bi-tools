
  const pickrOptions = (elId, defaultColor) => Pickr.create({
    el: '#' + elId,
    theme: 'classic',
    default: defaultColor,
    components: {
      preview: true,
      opacity: true,
      hue: true,
      interaction: { input: true, save: true }
    }
  });

  const shadowPickr = pickrOptions('shadowColorPicker', '#000000');
  const bgPickr = pickrOptions('backgroundColorPicker', '#ffffff');
  const borderPickr = pickrOptions('borderColorPicker', '#CCCCCC');

  const bindPickr = (pickrInstance, inputId) => {
    pickrInstance.on('save', (color, instance) => {
      document.getElementById(inputId).value = color.toHEXA().toString();
      instance.hide();
    });
    pickrInstance.on('change', (color) => {
      document.getElementById(inputId).value = color.toHEXA().toString();
    });
  };

  // Hidden inputs to store values
  ['shadowColor', 'backgroundColor', 'borderColor'].forEach(id => {
    if(!document.getElementById(id)){
      const inp = document.createElement('input');
      inp.type='hidden';
      inp.id=id;
      document.getElementById('customEffectsSection').appendChild(inp);
    }
  });

  bindPickr(shadowPickr, 'shadowColor');
  bindPickr(bgPickr, 'backgroundColor');
  bindPickr(borderPickr, 'borderColor');

import { ModuleTemplateService } from './module-template.service';

describe('ModuleTemplateService', () => {
  it('returns the validated create input through the module service boundary', () => {
    const service = new ModuleTemplateService();
    expect(service.create({ label: 'Example feature' })).toEqual({ label: 'Example feature' });
  });

  it('keeps update behavior in the service layer', () => {
    const service = new ModuleTemplateService();
    expect(service.updatePreview({ label: 'Updated feature' })).toEqual({
      label: 'Updated feature',
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { JournalService } from './journal';

describe('JournalService', () => {
  let service: JournalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JournalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should extract tags with German characters', () => {
    const text = 'Das ist ein #test für #grüße und #übermut und #österreich and #spaß';
    service.deleteAllEntries(); // Clear existing
    service.addEntry(text);
    const entries = service.entries();
    expect(entries.length).toBe(1);
    expect(entries[0].tags).toContain('test');
    expect(entries[0].tags).toContain('grüße');
    expect(entries[0].tags).toContain('übermut');
    expect(entries[0].tags).toContain('österreich');
    expect(entries[0].tags).toContain('spaß');
  });
});

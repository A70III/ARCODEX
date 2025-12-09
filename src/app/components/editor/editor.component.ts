import { Component, inject, ElementRef, ViewChild, OnDestroy, effect, signal, computed, Output, EventEmitter } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
import { SettingsService } from '../../services/settings.service';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

import { WelcomeComponent } from '../welcome/welcome.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [WelcomeComponent],
  template: `
    <div class="flex flex-col h-full bg-[var(--bg-primary)]">
      <!-- Tab bar -->
      @if (projectState.openedFiles().length > 0) {
        <div class="flex items-center bg-[var(--bg-secondary)] border-b border-[var(--border-color)] min-h-[35px] overflow-x-auto">
          @for (file of projectState.openedFiles(); track file.path) {
            <div 
              class="group flex items-center gap-1 px-3 py-1.5 border-r border-[var(--border-color)] cursor-pointer text-sm whitespace-nowrap"
              [class.bg-[var(--bg-primary)]]="projectState.activeFilePath() === file.path"
              [class.text-[var(--text-inverse)]]="projectState.activeFilePath() === file.path"
              [class.bg-[var(--bg-tertiary)]]="projectState.activeFilePath() !== file.path"
              [class.text-[var(--text-secondary)]]="projectState.activeFilePath() !== file.path"
              (click)="onTabClick(file.path)"
            >
              <span class="material-icons text-sm" [class]="getFileIconClass(file.name)">{{ getFileIcon(file.name) }}</span>
              <span class="text-[var(--text-primary)]">{{ file.name }}</span>
              @if (file.isDirty) {
                <span class="w-2 h-2 rounded-full bg-white ml-1"></span>
              }
              <button 
                class="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] transition-opacity"
                (click)="onCloseTab($event, file.path)"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
          }
        </div>
      }
      
      <!-- Formatting Toolbar -->
      @if (projectState.activeFile()) {
        <div class="flex items-center gap-1 px-2 py-1.5 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] flex-wrap">
          <!-- Text Style Group -->
          <div class="flex items-center gap-0.5 pr-2 border-r border-[var(--border-color)]">
            <button class="toolbar-btn" [class.active]="isActive('bold')" (click)="toggleBold()" title="Bold (Ctrl+B)">
              <span class="material-icons">format_bold</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('italic')" (click)="toggleItalic()" title="Italic (Ctrl+I)">
              <span class="material-icons">format_italic</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('underline')" (click)="toggleUnderline()" title="Underline (Ctrl+U)">
              <span class="material-icons">format_underlined</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('strike')" (click)="toggleStrike()" title="Strikethrough">
              <span class="material-icons">strikethrough_s</span>
            </button>
          </div>
          
          <!-- Heading Group -->
          <div class="flex items-center gap-0.5 px-2 border-r border-[#3c3c3c]">
            <button class="toolbar-btn" [class.active]="isActive('heading', { level: 1 })" (click)="toggleHeading(1)" title="Heading 1">
              <span class="text-sm font-bold">H1</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('heading', { level: 2 })" (click)="toggleHeading(2)" title="Heading 2">
              <span class="text-sm font-bold">H2</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('heading', { level: 3 })" (click)="toggleHeading(3)" title="Heading 3">
              <span class="text-sm font-bold">H3</span>
            </button>
          </div>
          
          <!-- Paragraph/List Group -->
          <div class="flex items-center gap-0.5 px-2 border-r border-[#3c3c3c]">
            <button class="toolbar-btn" (click)="setParagraph()" title="Paragraph">
              <span class="material-icons">notes</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('bulletList')" (click)="toggleBulletList()" title="Bullet List">
              <span class="material-icons">format_list_bulleted</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('orderedList')" (click)="toggleOrderedList()" title="Numbered List">
              <span class="material-icons">format_list_numbered</span>
            </button>
            <button class="toolbar-btn" [class.active]="isActive('blockquote')" (click)="toggleBlockquote()" title="Quote">
              <span class="material-icons">format_quote</span>
            </button>
          </div>
          
          <!-- Alignment Group -->
          <div class="flex items-center gap-0.5 px-2 border-r border-[#3c3c3c]">
            <button class="toolbar-btn" [class.active]="isAligned('left')" (click)="setAlign('left')" title="Align Left">
              <span class="material-icons">format_align_left</span>
            </button>
            <button class="toolbar-btn" [class.active]="isAligned('center')" (click)="setAlign('center')" title="Align Center">
              <span class="material-icons">format_align_center</span>
            </button>
            <button class="toolbar-btn" [class.active]="isAligned('right')" (click)="setAlign('right')" title="Align Right">
              <span class="material-icons">format_align_right</span>
            </button>
            <button class="toolbar-btn" [class.active]="isAligned('justify')" (click)="setAlign('justify')" title="Justify">
              <span class="material-icons">format_align_justify</span>
            </button>
          </div>
          
          <!-- Actions Group -->
          <div class="flex items-center gap-0.5 px-2">
            <button class="toolbar-btn" (click)="undo()" title="Undo (Ctrl+Z)">
              <span class="material-icons">undo</span>
            </button>
            <button class="toolbar-btn" (click)="redo()" title="Redo (Ctrl+Y)">
              <span class="material-icons">redo</span>
            </button>
          </div>
          
          <!-- Spacer -->
          <div class="flex-1"></div>
          
          <!-- Save button -->
          <button 
            class="flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors"
            [class.bg-[var(--accent)]]="isDirty()"
            [class.hover:bg-[var(--accent-hover)]]="isDirty()"
            [class.text-[var(--text-inverse)]]="isDirty()"
            [class.bg-[var(--bg-hover)]]="!isDirty()"
            [class.text-[var(--text-secondary)]]="!isDirty()"
            (click)="save()"
            title="Save (Ctrl+S)"
          >
            <span class="material-icons text-sm">save</span>
            Save
          </button>
        </div>
      }
      
      <!-- Editor area -->
      <div class="flex-1 overflow-auto" (keydown)="onKeyDown($event)">
        @if (projectState.activeFile()) {
          <div class="h-full p-6 max-w-4xl mx-auto">
            <div 
              class="editor-wrapper h-full flex"
              [style.--editor-font]="settingsService.editorFontFamily()"
              [style.--editor-font-size.px]="settingsService.editorFontSize()"
            >
              <!-- Line Numbers Gutter -->
              @if (settingsService.showLineNumbers()) {
                <div class="line-numbers-gutter">
                  @for (line of lineNumbers(); track line) {
                    <div class="line-number">{{ line }}</div>
                  }
                </div>
              }
              <!-- Editor Container -->
              <div #editorContainer class="editor-container flex-1 h-full"></div>
            </div>
          </div>
        } @else {
          <app-welcome class="h-full" />
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    
    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      color: var(--text-primary);
      transition: all 0.15s;
    }
    
    .toolbar-btn:hover {
      background-color: var(--bg-hover);
    }
    
    .toolbar-btn.active {
      background-color: var(--bg-active);
      color: var(--text-inverse);
    }
    
    .toolbar-btn .material-icons {
      font-size: 18px;
    }
    
    .editor-wrapper {
      min-height: 100%;
    }
    
    .line-numbers-gutter {
      width: 48px;
      flex-shrink: 0;
      padding-top: 0;
      padding-right: 8px;
      text-align: right;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: var(--editor-font-size, 16px);
      line-height: 1.9;
      color: var(--line-number-color, #6e6e6e);
      user-select: none;
      border-right: 1px solid var(--line-number-border, #3c3c3c);
      margin-right: 16px;
    }
    
    .line-number {
      height: calc(var(--editor-font-size, 16px) * 1.9);
    }
    
    .editor-container {
      min-height: 100%;
    }
    
    :host ::ng-deep .tiptap {
      outline: none;
      min-height: 100%;
      font-family: var(--editor-font, 'Georgia'), 'Times New Roman', serif;
      font-size: var(--editor-font-size, 16px);
      line-height: 1.9;
      color: var(--text-primary);
      padding-bottom: 200px;
    }
    
    :host ::ng-deep .tiptap:focus {
      outline: none;
    }
    
    :host ::ng-deep .tiptap p {
      margin: 0.8em 0;
      text-indent: 2em; /* Paragraph indentation */
    }
    
    :host ::ng-deep .tiptap h1, 
    :host ::ng-deep .tiptap h2, 
    :host ::ng-deep .tiptap h3,
    :host ::ng-deep .tiptap blockquote,
    :host ::ng-deep .tiptap ul,
    :host ::ng-deep .tiptap ol {
      text-indent: 0; /* Reset indent for non-paragraphs */
    }

    :host ::ng-deep .tiptap h1 {
      font-size: 2em;
      font-weight: 600;
      color: var(--text-inverse);
      margin: 1em 0 0.5em;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.3em;
    }
    
    :host ::ng-deep .tiptap h2 {
      font-size: 1.6em;
      font-weight: 600;
      color: var(--text-inverse);
      margin: 0.9em 0 0.4em;
    }
    
    :host ::ng-deep .tiptap h3 {
      font-size: 1.3em;
      font-weight: 600;
      color: #ffffff;
      margin: 0.7em 0 0.35em;
    }
    
    :host ::ng-deep .tiptap strong {
      color: var(--text-inverse);
      font-weight: 600;
    }
    
    :host ::ng-deep .tiptap em {
      color: var(--text-primary);
    }
    
    :host ::ng-deep .tiptap u {
      text-decoration: underline;
    }
    
    :host ::ng-deep .tiptap s {
      text-decoration: line-through;
      color: var(--text-secondary);
    }
    
    :host ::ng-deep .tiptap blockquote {
      border-left: 3px solid var(--accent);
      padding-left: 1em;
      margin-left: 0;
      color: var(--text-secondary);
      font-style: italic;
    }
    
    :host ::ng-deep .tiptap ul, 
    :host ::ng-deep .tiptap ol {
      padding-left: 1.5em;
    }
    
    :host ::ng-deep .tiptap li {
      margin: 0.3em 0;
    }
    
    :host ::ng-deep .tiptap p.is-editor-empty:first-child::before {
      color: var(--text-muted);
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }
  `],
  host: {
    '(document:keydown)': 'onKeyDown($event)'
  }
})
export class EditorComponent implements OnDestroy {
  @ViewChild('editorContainer') editorContainer?: ElementRef<HTMLDivElement>;
  
  projectState = inject(ProjectStateService);
  settingsService = inject(SettingsService);
  private editor: Editor | null = null;
  private currentFilePath = '';
  private isUpdatingFromService = false;
  private editorState = signal({ bold: false, italic: false });
  
  // Line numbers - computed from editor content
  private _lineCount = signal(1);
  private lineCountTimer: any = null;
  private cachedLineHeight = 0;
  
  readonly lineNumbers = computed(() => {
    const count = Math.max(this._lineCount(), 20); // minimum 20 lines for visual consistency
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  constructor() {
    effect(() => {
      const activeFile = this.projectState.activeFile();
      
      if (activeFile) {
        if (this.currentFilePath !== activeFile.path) {
          this.currentFilePath = activeFile.path;
          setTimeout(() => {
            if (this.editorContainer?.nativeElement) {
              if (this.editor) {
                this.isUpdatingFromService = true;
                this.editor.commands.setContent(this.parseContent(activeFile.content));
                this.isUpdatingFromService = false;
              } else {
                this.initEditor(activeFile.content);
              }
            }
          }, 0);
        }
      } else {
        this.currentFilePath = '';
        this.destroyEditor();
      }
    });

    // Listen for editor actions from header menu or global shortcuts
    document.addEventListener('editorAction', this.onEditorAction.bind(this));
  }

  ngOnDestroy(): void {
    this.destroyEditor();
    document.removeEventListener('editorAction', this.onEditorAction.bind(this));
  }

  private onEditorAction(e: Event): void {
    const action = (e as CustomEvent).detail;
    if (!this.editor) return;

    switch (action) {
      case 'Undo': this.undo(); break;
      case 'Redo': this.redo(); break;
      case 'Cut': 
        // TipTap doesn't support programmatic cut/copy easily due to browser security
        // But we can try focusing and letting browser handle checks
        this.editor.commands.focus();
        document.execCommand('cut');
        break;
      case 'Copy':
        this.editor.commands.focus();
        document.execCommand('copy');
        break;
      case 'Paste':
        this.editor.commands.focus();
        navigator.clipboard.readText().then(text => {
          this.editor?.commands.insertContent(text);
        }).catch(err => console.error('Failed to read clipboard', err));
        break;
      // Find/Replace would require a more complex UI/Extension
    }
  }

  private initEditor(content: string): void {
    if (!this.editorContainer?.nativeElement) return;
    
    this.editorContainer.nativeElement.innerHTML = '';

    this.editor = new Editor({
      element: this.editorContainer.nativeElement,
      extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Placeholder.configure({
          placeholder: 'สถาปนาเรื่องเล่าของท่าน...',
        }),
      ],
      content: this.parseContent(content),
      editorProps: {
        attributes: {
          class: 'tiptap',
        },
      },
      onCreate: ({ editor }) => {
        this.updateLineCount(editor);
      },
      onUpdate: ({ editor }) => {
        if (this.isUpdatingFromService) return;
        
        this.updateLineCount(editor);
        
        const activeFile = this.projectState.activeFile();
        if (activeFile) {
          const htmlContent = editor.getHTML();
          this.projectState.updateFileContent(activeFile.path, htmlContent);
        }
      },
    });
  }

  private updateLineCount(editor: Editor): void {
    // Debounce line count updates to avoid performance issues
    if (this.lineCountTimer) {
      clearTimeout(this.lineCountTimer);
    }
    
    this.lineCountTimer = setTimeout(() => {
      this.calculateLineCount(editor);
    }, 200); // 200ms debounce
  }

  private calculateLineCount(editor: Editor): void {
    const editorElement = this.editorContainer?.nativeElement.querySelector('.tiptap');
    if (!editorElement) {
      // Fallback to block count
      this._lineCount.set(Math.max(1, editor.state.doc.childCount));
      return;
    }
    
    // Cache line height (only calculate once per session or when font changes)
    if (!this.cachedLineHeight) {
      const computedStyle = window.getComputedStyle(editorElement);
      const fontSize = parseFloat(computedStyle.fontSize) || 16;
      this.cachedLineHeight = parseFloat(computedStyle.lineHeight) || (fontSize * 1.9);
    }
    
    // Get the actual content height (fast operation)
    const contentHeight = editorElement.scrollHeight;
    
    // Calculate visual line count
    const visualLineCount = Math.ceil(contentHeight / this.cachedLineHeight);
    
    this._lineCount.set(Math.max(1, visualLineCount));
  }

  private destroyEditor(): void {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }

  private parseContent(content: string): string {
    if (!content) return '<p></p>';
    if (content.startsWith('<')) return content;
    return `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
  }

  // Toolbar state checks
  isActive(name: string, attributes?: Record<string, any>): boolean {
    return this.editor?.isActive(name, attributes) ?? false;
  }

  isAligned(alignment: string): boolean {
    return this.editor?.isActive({ textAlign: alignment }) ?? false;
  }

  isDirty(): boolean {
    return this.projectState.activeFile()?.isDirty ?? false;
  }

  // Formatting commands
  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleUnderline(): void {
    this.editor?.chain().focus().toggleUnderline().run();
  }

  toggleStrike(): void {
    this.editor?.chain().focus().toggleStrike().run();
  }

  toggleHeading(level: 1 | 2 | 3): void {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }

  setParagraph(): void {
    this.editor?.chain().focus().setParagraph().run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  toggleBlockquote(): void {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  setAlign(alignment: 'left' | 'center' | 'right' | 'justify'): void {
    this.editor?.chain().focus().setTextAlign(alignment).run();
  }

  undo(): void {
    this.editor?.chain().focus().undo().run();
  }

  redo(): void {
    this.editor?.chain().focus().redo().run();
  }

  save(): void {
    this.projectState.saveActiveFile();
  }

  onTabClick(path: string): void {
    this.projectState.setActiveFile(path);
  }

  onCloseTab(event: Event, path: string): void {
    event.stopPropagation();
    this.projectState.closeFile(path);
  }

  onKeyDown(event: KeyboardEvent): void {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    if (isCtrlOrCmd && event.key === 's') {
      event.preventDefault();
      this.projectState.saveActiveFile();
    }
  }

  // --- Icons ---

  getFileIcon(fileName: string): string {
    if (fileName.endsWith('.taleside')) return 'auto_stories';
    if (fileName.endsWith('.md')) return 'description';
    if (fileName.endsWith('.txt')) return 'article';
    if (fileName.endsWith('.json')) return 'data_object';
    return 'insert_drive_file';
  }

  getFileIconClass(fileName: string): string {
    if (fileName.endsWith('.taleside')) return 'text-[var(--accent)]';
    if (fileName.endsWith('.md')) return 'text-[var(--info)]';
    if (fileName.endsWith('.txt')) return 'text-[var(--text-secondary)]';
    if (fileName.endsWith('.json')) return 'text-[var(--warning)]';
    return 'text-[var(--text-secondary)]';
  }
}

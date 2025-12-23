const App = require('../src/app.js');

describe("History save/load", () => {
  beforeEach(() => {
    // clear localStorage
    if (typeof localStorage !== "undefined") localStorage.removeItem("reviseia_history");
    document.body.innerHTML = "";
  });

  test("getHistory / setHistory basic", () => {
    expect(App.getHistory()).toEqual([]);
    App.setHistory([{topic:"t1", content:"c1"}]);
    expect(App.getHistory()).toEqual([{topic:"t1", content:"c1"}]);
  });

  test("saveToHistory adds at front and trims to 10", () => {
    // add 12 items
    for (let i=0;i<12;i++){
      App.saveToHistory("t"+i, "c"+i);
    }
    const h = App.getHistory();
    expect(h.length).toBe(10);
    expect(h[0].topic).toBe("t11");
    expect(h[h.length-1].topic).toBe("t2");
  });

  test("saveToHistory replaces duplicate topic", () => {
    App.saveToHistory("dup","first");
    App.saveToHistory("dup","second");
    const h = App.getHistory();
    expect(h.length).toBe(1);
    expect(h[0].topic).toBe("dup");
    expect(h[0].content).toBe("second");
  });
});

describe("renderHistory (DOM)", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") localStorage.removeItem("reviseia_history");
    document.body.innerHTML = "";
  });

  test("renderHistory renders list and clicking reloads content", () => {
    App.setHistory([
      {topic:"A", content:"Content A"},
      {topic:"B", content:"Content B"}
    ]);

    const ul = document.createElement("ul");
    const out = document.createElement("div");
    const status = document.createElement("span");
    App.renderHistory(ul, out, status);

    expect(ul.children.length).toBe(2);
    const firstLi = ul.children[0];
    expect(firstLi.textContent).toBe("A");

    // simulate click
    firstLi.onclick();
    expect(out.textContent).toBe("Content A");
    expect(status.textContent).toContain("Rechargé");
  });
});

describe("openPdf behavior", () => {
  test("returns false when popup blocked (window.open returns null)", () => {
    const fakeWindow = {
      open: () => null
    };
    const ok = App.openPdf("something", fakeWindow);
    expect(ok).toBe(false);
  });

  test("writes document when popup available", () => {
    const writeMock = jest.fn();
    const closeMock = jest.fn();
    const fakeWin = {
      document: {
        write: writeMock,
        close: closeMock
      }
    };
    const fakeWindow = { open: ()=> fakeWin };
    const ok = App.openPdf("<tag>", fakeWindow);
    expect(ok).toBe(true);
    expect(writeMock).toHaveBeenCalled();
    // content should be escaped; check that the call contains &lt;tag&gt;
    const arg = writeMock.mock.calls[0][0];
    expect(arg).toContain("&lt;tag&gt;");
  });
});

describe("copyText (clipboard fallback)", () => {
  beforeEach(() => {
    // ensure DOM body exists
    document.body.innerHTML = "<div></div>";
  });

  afterEach(() => {
    // cleanup navigator.clipboard if set
    try { delete navigator.clipboard; } catch(e) {}
  });

  test("uses navigator.clipboard when available", async () => {
    navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue(undefined)
    };
    const ok = await App.copyText("abc", { navigator: navigator, document: document });
    expect(ok).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("abc");
  });

  test("falls back to textarea + execCommand when clipboard not available", async () => {
    // remove navigator.clipboard
    try { delete navigator.clipboard; } catch(e) {}
    // mock execCommand
    document.execCommand = jest.fn().mockReturnValue(true);

    const ok = await App.copyText("xyz", { navigator: undefined, document: document });
    expect(ok).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../components/SearchBar";
import { jest } from "@jest/globals";

describe("SearchBar", () => {
  it("renders input with placeholder", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Search notes...")).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const handleChange = jest.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText("Search notes...");
    await userEvent.type(input, "hello");

    expect(handleChange).toHaveBeenCalledTimes(5);
  });

  it("does not show clear button when value is empty", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("shows clear button when value exists", () => {
    render(<SearchBar value="test" onChange={() => {}} />);
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("calls onChange with empty string when clear is clicked", async () => {
    const handleChange = jest.fn();
    render(<SearchBar value="test" onChange={handleChange} />);

    await userEvent.click(screen.getByLabelText("Clear search"));
    expect(handleChange).toHaveBeenCalledWith("");
  });
});
